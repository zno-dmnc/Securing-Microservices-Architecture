const express = require('express');
const app = express();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit')

app.use(express.json());

const orders = [];
const secretKey = 'secretkey123';


const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
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
}

const authRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if(!allowedRoles.includes(userRole)) {
            return res.status(403).json({message: 'Access Denied: Insufficient privileges!'});
        }
        next();
    };
};

async function getCustomerById(id){
    try{
        const response = await axios.get(`http://localhost:3002/customers/${id}`);
        return response.data.data;
    }
    catch(error){
        throw new Error('Customer not found.');
    }
}

async function getProductById(id){
    try{
        const response = await axios.get(`http://localhost:3001/products/${id}`);
        return response.data.data;
    }
    catch(error){
        throw new Error('Product not found.');
    }
}

async function removeProductQuantity(productId, quantity){
    try{
        const response = await axios.put(`http://localhost:3001/update-quantity/${productId}`, {
            quantity: quantity
        });
        return response.data.data;
    }
    catch(error){
        throw new Error('Failed to update product quantity.');
    }
}

async function addProductQuantity(productId, quantity){
    try{
        const res = await axios.get(`http://localhost:3001/products/${productId}`);
        const product = res.data.data;
        const newQuantity = product.quantity + quantity;
        const response = await axios.put(`http://localhost:3001/update-product/${productId}`, {
            quantity: newQuantity
        });
        return response.data.data;
    }
    catch(error){
        throw new Error('Failed to update product quantity.');
    }
}

app.get('/orders', authenJWT, authRole(['admin', 'user']), (req, res) => {
    if(orders.length === 0){
        return res.status(404).json({message: 'No orders found.'});
    }
    return res.status(200).json({data: orders});
});

app.get('/orders/:id', authenJWT, authRole(['admin', 'user']), (req, res) => {
    const {id} = req.params;
    const order = orders.find((ord) => ord.id === Number(id));
    if(!order){
        return res.status(404).json({message: 'Order not found.'});
    }
    return res.status(200).json({data: order});
});

app.post('/add-order', authenJWT, authRole(['admin', 'user']), async (req, res) => {
    try{
        const {customerId, productId, quantity} = req.body;
        if(!customerId || !productId || !quantity){
            return res.status(400).json({message: 'Please provide customerId, productId and quantity.'});
        }
        const customer = await getCustomerById(customerId);
        const product = await getProductById(productId);
        if(product.quantity < quantity){
            return res.status(400).json({message: 'Product out of stock.'});
        }
        const updatedProduct = await removeProductQuantity(productId, quantity);
        const order = {
            id: orders.length + 1,
            customer,
            product: updatedProduct,
            quantity,
        };
        orders.push(order);
        return res.status(201).json({message: 'Order added successfully.', data: order});
    }
    catch(error){
        return res.status(404).json({message: error.message});
    }
});

app.put('/update-order/:id', authenJWT, authRole(['admin']), async (req, res) => {
    const {id} = req.params;
    const {customerId, productId, quantity} = req.body;
    const order = orders.find((ord) => ord.id === Number(id));
    if(!order){
        return res.status(404).json({message: 'Order not found.'});
    }
    if(customerId){
        const customer = await getCustomerById(customerId);
        order.customer = customer;
    }
    if(productId){
        
        const product = await getProductById(productId);
        if(product.quantity < quantity){
            return res.status(400).json({message: 'Product out of stock.'});
        }
        addProductQuantity(order.product.id, order.quantity);
        if(!quantity){
            const updatedProduct = await removeProductQuantity(productId, order.quantity);
            order.product = updatedProduct;
        }else{
            const updatedProduct = await removeProductQuantity(productId, quantity);
            order.product = updatedProduct;
        }
    }
    if(quantity){
        const product = await getProductById(order.product.id);
        if(product.quantity < quantity){
            return res.status(400).json({message: 'Product out of stock.'});
        }
        const difference = order.quantity - quantity;
        if(difference > 0){
            const newP = await addProductQuantity(order.product.id, difference);
            console.log(newP)
            order.product = newP
        }
        else{
            const newP = await removeProductQuantity(order.product.id, Math.abs(difference));
            console.log(newP)
            order.product = newP
        }
        order.quantity = quantity;
    }
    return res.status(200).json({message: 'Order updated successfully.', data: order});
});

app.delete('/delete-order/:id', authenJWT, authRole(['admin']), (req, res) => {
    const {id} = req.params;
    const order = orders.find((ord) => ord.id === Number(id));
    if(!order){
        return res.status(404).json({message: 'Order not found.'});
    }
    orders.splice(orders.indexOf(order), 1);
    return res.status(200).json({message: 'Order deleted successfully.'});
});



app.listen(3003, () => {
    console.log('Orders service running on port 3003');
});