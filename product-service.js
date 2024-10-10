const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const app = express();

const authenticateToken = require('./middlewares/authMiddleware');
const { validateProductInput, checkValidationResults } = require('./middlewares/inputValidation');
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

const products = [];

app.get('/products', authenticateToken, authPage(["admin", "customer"]), rateLimit, (req, res) => {
    if (products.length === 0) {
        return res.status(404).json({ message: 'No products found' });
    } else {
        return res.status(200).json({ data: products });
    }
});

app.get('/products/:id', authenticateToken, authPage(["admin", "customer"]), rateLimit, (req, res) => {
    const product = products.find(prod => prod.id === parseInt(req.params.id));
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    } else {
        return res.status(200).json({ data: product });
    }
});

app.post('/add-product', validateProductInput, checkValidationResults, rateLimit, (req, res) => {
    const { name, quantity } = req.body;
    const product = {
        id: products.length + 1,
        name,
        quantity
    };

    products.push(product);
    return res.status(201).json({ message: "Product added successfully", product_id: product.id, product_name: product.name });
});

app.put('/update-product/:id', authenticateToken, authPage(["admin"]), rateLimit, (req, res) => {
    const { id } = req.params;
    const { name, quantity } = req.body;
    const product = products.find(prod => prod.id === parseInt(id));

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name;
    product.quantity = quantity;

    return res.status(200).json({ message: "Product updated successfully", product_id: product.id, product_name: product.name });
});

app.delete('/delete-product/:id', authenticateToken, authPage(["admin"]), rateLimit, (req, res) => {
    const { id } = req.params;
    const product = products.find(prod => prod.id === parseInt(id));

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    products.splice(products.indexOf(product), 1);
    return res.status(200).json({ message: "Product deleted successfully" });
});


sslServer.listen(3001, () => {
    console.log('Product service started on port 3001');
});
