const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

app.use(express.json());
const products = []
const secretKey = 'secretkey123';

const limiter = rateLimit({
    windowsMs: 5 * 60 * 1000,
    limit: 10,
    message: 'Too many requests. Try again later.'
});
app.use(limiter);

const authenJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if(!token) {
        return res.status(401).json({message: 'Access Denied: No Token Provided.'});
    }

    jwt.verify(token, secretKey, (err, user) => {
        if(err) {
            return res.status(403).json({message: 'Invalid token!'});
        }
        req.user = user;
        next();
    });
};

const authRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if(!allowedRoles.includes(userRole)) {
            return res.status(403).json({message: 'Access Denied: Insufficient privileges.'});
        }
        next();
    };
};

app.get('/products', authenJWT, authRole(['admin', 'user']), (req, res) => {
    if(products.length === 0) {
        return res.status(404).json({message: 'No products found'});
    }
    return res.status(200).json({data: products});
});   

app.get('/products/:id', authenJWT, authRole(['admin', 'user']), (req, res) => {
    const {id} = req.params;
    const product = products.find((product) => product.id === Number(id));
    if(!product) {
        return res.status(404).json({message: 'Product not found'});
    }
    return res.status(200).json({data: product});
});

app.post('/add-product', authenJWT, authRole(['admin']), (req, res) => {
    const name = req.body.name;
    const quantity = parseInt(req.body.quantity);
    if(!name || !quantity) {
        return res.status(400).json({message: 'Please provide name and quantity'});
    }
    const product = {
        id: products.length + 1,
        name,
        quantity,
    }
    const existingProduct = products.find((product) => product.name === name);
    if(existingProduct) {
        products.map((product) => {
            if(product.name === name) {
                product.quantity += quantity;
            }
        });
    }else{
        products.push(product);
    }
    return res.status(201).json({message: 'Product added successfully', data: product});
});

app.put('/update-product/:id', authenJWT, authRole(['admin']), (req, res) => {
    const {id} = req.params;
    const name = req.body.name;
    const quantity = parseInt(req.body.quantity);
    const product = products.find((product) => product.id === Number(id));
    if(!product) {
        return res.status(404).json({message: 'Product not found'});
    }
    if(name) {
        product.name = name;
    }
    if(quantity) {
        product.quantity = quantity;
    }
    return res.status(200).json({message: 'Product updated successfully', data: product});
});

app.put('/update-quantity/:id', authenJWT, authRole(['admin']), (req, res) => {
    const {id} = req.params;
    const quantity = parseInt(req.body.quantity);
    const product = products.find((product) => product.id === Number(id));
    if(!product) {
        return res.status(404).json({message: 'Product not found'});
    }
    product.quantity -= quantity;
    return res.status(200).json({message: 'Product quantity updated successfully', data: product});
});

app.delete('/delete-product/:id', authenJWT, authRole(['admin']), (req, res) => {
    const {id} = req.params;
    const product = products.find((product) => product.id === Number(id));
    if(!product) {
        return res.status(404).json({message: 'Product not found'});
    }
    products.splice(products.indexOf(product), 1);
    return res.status(200).json({message: 'Product deleted successfully'});
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});