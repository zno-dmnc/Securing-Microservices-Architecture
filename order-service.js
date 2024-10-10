const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const app = express();

const authenticateToken = require('./middlewares/authMiddleware');
const { validateNewOrdersInput, checkValidationResults, validateEditOrdersInput } = require('./middlewares/inputValidation');
const rateLimit = require('./middlewares/rateLimiterMiddleware');
const authPage = require('./middlewares/rbacMiddleware');

const https = require('https');
const path = require('path');
const fs = require('fs');

const sslServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
}, app);

app.use(express.json());

const orders = [];

app.get('/orders', authenticateToken, authPage(["admin", "customer"]), rateLimit, (req, res) => {
    if (orders.length === 0) {
        return res.status(404).json({ message: 'No orders found' });
    } else {
        return res.status(200).json({ data: orders });
    }
});

app.get('/orders/:id', authenticateToken, authPage(["admin", "customer"]), rateLimit, (req, res) => {
    const order = orders.find(ord => ord.id === parseInt(req.params.id));
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    } else {
        return res.status(200).json({ data: order });
    }
});

app.post('/add-order', validateNewOrdersInput, checkValidationResults, rateLimit, (req, res) => {
    const {customerID, productID, quantity } = req.body;
    const order = {
        id: orders.length + 1,
        customerID,
        productID,
        quantity
    };

    orders.push(order);
    return res.status(201).json({ message: "Order added successfully", order_id: order.id });
});

app.put('/update-order/:id', authenticateToken, authPage(["admin"]), rateLimit, validateEditOrdersInput, checkValidationResults, (req, res) => {
    const { id } = req.params;
    const { productID, quantity } = req.body;
    const order = orders.find(ord => ord.id === parseInt(id));

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    order.productID = productID;
    order.quantity = quantity;

    return res.status(200).json({ message: "Order updated successfully", order_id: order.id });
});

app.delete('/delete-order/:id', authenticateToken, authPage(["admin"]), rateLimit, (req, res) => {
    const { id } = req.params;
    const order = orders.find(ord => ord.id === parseInt(id));

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    orders.splice(orders.indexOf(order), 1);
    return res.status(200).json({ message: "Order deleted successfully" });
});


sslServer.listen(3003, () => {
    console.log('Order service started on port 3003');
});
