const express = require('express');
const app = express();
const axios = require('axios');

const authenticateToken = require('../Securing-Microservices-Architecture/middlewares/authMiddleware');
const {validateNewOrdersInput, validateEditOrdersInput, checkValidationResults} = require ('../Securing-Microservices-Architecture/middlewares/inputValidation');
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

const orders = [];

const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});

  async function getCustomerById(id, req) {
    try {
      const response = await axios.get(`https://localhost:3002/user/${id}`, {
        headers: {
            Authorization: req.headers['authorization'],
        },
        httpsAgent
      });
      return response.data.data;
    } catch (error) {
      console.error(error);
      throw new Error('Customer not found.');
    }
  }

async function getProductById(id, req){
    try{
        const response = await axios.get(`https://localhost:3001/product/${id}`, {
            headers: {
                Authorization: req.headers['authorization'],
            },
            httpsAgent
        });
        return response.data.data;
    }
    catch(error){
        throw new Error('Product not found.');
    }
}

async function removeProductQuantity(productId, quantity, req){
    try{
        const response = await axios.put(`https://localhost:3001/update-quantity/${productId}`, {
            quantity: quantity
        }, {
            headers: {
                Authorization: req.headers['authorization'],
            },
            httpsAgent
        });
        return response.data.data;
    }
    catch(error){
        throw new Error('Failed to update product quantity.');
    }
}

async function addProductQuantity(productId, quantity, req){
    try{
        const res = await axios.get(`https://localhost:3001/products/${productId}`, {
            httpsAgent
        });
        const product = res.data.data;
        const newQuantity = product.quantity + quantity;
        const response = await axios.put(`https://localhost:3001/update-product/${productId}`, {
            quantity: newQuantity
        }, {
            httpsAgent
        });
        return response.data.data;
    }
    catch(error){
        throw new Error('Failed to update product quantity.');
    }
}

app.get('/all', authenticateToken, authPage(["admin"]), checkValidationResults, rateLimit, (req, res) => {
    if(orders.length === 0){
        return res.status(404).json({message: 'No orders found.'});
    }
    return res.status(200).json({data: orders});
});

app.get('/order/:id', authenticateToken, authPage(["admin"]), checkValidationResults, rateLimit,(req, res) => {
    const {id} = req.params;
    const order = orders.find((ord) => ord.id === Number(id));
    if(!order){
        return res.status(404).json({message: 'Order not found.'});
    }
    return res.status(200).json({data: order});
});

app.post('/add-order', authenticateToken, authPage(["admin", "customer"]), validateNewOrdersInput, checkValidationResults, rateLimit, async (req, res) => {
    try{
        const {customerId, productId, quantity} = req.body;
        const customer = await getCustomerById(customerId, req);
        const product = await getProductById(productId, req);
        if(product.quantity < quantity){
            return res.status(400).json({message: 'Product out of stock.'});
        }
        const updatedProduct = await removeProductQuantity(productId, quantity, req);
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

app.put('/update-order/:id', authenticateToken, authPage(["admin"]), validateEditOrdersInput, checkValidationResults, rateLimit,async (req, res) => {
    const {id} = req.params;
    const {customerId, productId, quantity} = req.body;
    const order = orders.find((ord) => ord.id === Number(id));
    if(!order){
        return res.status(404).json({message: 'Order not found.'});
    }
    if(customerId){
        const customer = await getCustomerById(customerId, req);
        order.customer = customer;
    }
    if(productId){
        
        const product = await getProductById(productId, req);
        if(product.quantity < quantity){
            return res.status(400).json({message: 'Product out of stock.'});
        }
        addProductQuantity(order.product.id, order.quantity, req);
        if(!quantity){
            const updatedProduct = await removeProductQuantity(productId, order.quantity, req);
            order.product = updatedProduct;
        }else{
            const updatedProduct = await removeProductQuantity(productId, quantity, req);
            order.product = updatedProduct;
        }
    }
    if(quantity){
        const product = await getProductById(order.product.id, req);
        if(product.quantity < quantity){
            return res.status(400).json({message: 'Product out of stock.'});
        }
        const difference = order.quantity - quantity;
        if(difference > 0){
            const newP = await addProductQuantity(order.product.id, difference, req);
            console.log(newP)
            order.product = newP
        }
        else{
            const newP = await removeProductQuantity(order.product.id, Math.abs(difference), req);
            console.log(newP)
            order.product = newP
        }
        order.quantity = quantity;
    }
    return res.status(200).json({message: 'Order updated successfully.', data: order});
});

app.delete('/delete-order/:id', authenticateToken, authPage(["admin"]), checkValidationResults, rateLimit, (req, res) => {
    const {id} = req.params;
    const order = orders.find((ord) => ord.id === Number(id));
    if(!order){
        return res.status(404).json({message: 'Order not found.'});
    }
    orders.splice(orders.indexOf(order), 1);
    return res.status(200).json({message: 'Order deleted successfully.'});
});



sslServer.listen(3003, () => {
    console.log('Orders service running on port 3003');
});