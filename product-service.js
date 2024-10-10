const express = require('express');
const app = express();

const authenticateToken = require('../Securing-Microservices-Architecture/middlewares/authMiddleware');
const {validateProductInput, validateProductEditInput, checkValidationResults} = require ('../Securing-Microservices-Architecture/middlewares/inputValidation');
const rateLimit = require('../Securing-Microservices-Architecture/middlewares/rateLimiterMiddleware');
const authPage = require('../Securing-Microservices-Architecture/middlewares/rbacMiddleware');

const https = require('https');
const path = require('path');
const fs = require('fs');

const sslServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
}, app)

app.use(express.json());
const products = []

app.get('/all', authenticateToken, authPage(["admin", "customer"]), rateLimit,(req, res) => {
    if(products.length === 0) {
        return res.status(404).json({message: 'No products found'});
    }
    return res.status(200).json({data: products});
});   

app.get('/product/:id', authenticateToken, authPage(["admin", "customer"]), rateLimit,(req, res) => {
    const {id} = req.params;
    const product = products.find((product) => product.id === Number(id));
    if(!product) {
        return res.status(404).json({message: 'Product not found'});
    }
    return res.status(200).json({data: product});
});

app.post('/add-product', authenticateToken, authPage(["admin"]), validateProductInput, checkValidationResults, rateLimit,(req, res) => {
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

app.put('/update-product/:id', authenticateToken, authPage(["admin"]), validateProductInput, checkValidationResults, rateLimit,(req, res) => {
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

app.put('/update-quantity/:id', authenticateToken, authPage(["admin"]), validateProductEditInput, checkValidationResults, rateLimit,(req, res) => {
    const {id} = req.params;
    const quantity = parseInt(req.body.quantity);
    const product = products.find((product) => product.id === Number(id));
    if(!product) {
        return res.status(404).json({message: 'Product not found'});
    }
    product.quantity -= quantity;
    return res.status(200).json({message: 'Product quantity updated successfully', data: product});
});

app.delete('/delete-product/:id', authenticateToken, authPage(["admin"]), checkValidationResults, rateLimit,(req, res) => {
    const {id} = req.params;
    const product = products.find((product) => product.id === Number(id));
    if(!product) {
        return res.status(404).json({message: 'Product not found'});
    }
    products.splice(products.indexOf(product), 1);
    return res.status(200).json({message: 'Product deleted successfully'});
});

sslServer.listen(3001, () => {
  console.log('Server is running on port 3001');
});