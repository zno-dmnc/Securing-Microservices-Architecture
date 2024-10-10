const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const authenticateToken = require('../Securing-Microservices-Architecture/middlewares/authMiddleware');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Loading SSL certificate
const sslServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
}, app)

// Proxy options for microservices
const productServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3001', // URL of the product service
    changeOrigin: true,
    secure: false,
    onError: (err, req, res) => {
        console.log(err);
        console.error(`Error occurred while trying to proxy to Product Service:`, err.message);
        res.status(500).json({ error: 'Proxy error occurred.' });
    },
});

const loginServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3002/login', // URL of the user service
    changeOrigin: true,
    secure: false,
    onError: (err, req, res) => {
        console.log(err);
        console.error(`Error occurred while trying to proxy to Login:`, err.message);
        res.status(500).json({ error: 'Proxy error occurred.' });
    },
});

const userServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3002', // URL of the user service
    changeOrigin: true,
    secure: false,
    onError: (err, req, res) => {
        console.log(err);
        console.error(`Error occurred while trying to proxy to User Service:`, err.message);
        res.status(500).json({ error: 'Proxy error occurred.' });
    },
});

const orderServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3003', // URL of the order service
    changeOrigin: true,
    secure: false,
    onError: (err, req, res) => {
        console.log(err);
        console.error(`Error occurred while trying to proxy to Order Service:`, err.message);
        res.status(500).json({ error: 'Proxy error occurred.' });
    },
});

app.use('/login', loginServiceProxy); // Proxy the login request to the user service

// Routes
app.use('/products',productServiceProxy); // All /products routes go to product service
app.use('/orders',orderServiceProxy); // All /orders routes go to order service
app.use('/users', userServiceProxy); // All /users routes go to user service

sslServer.listen(3000, () => {
    console.log('gateway started on port 3000');
});