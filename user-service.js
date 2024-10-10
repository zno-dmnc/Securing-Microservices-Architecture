const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const app = express();

const authenticateToken = require('../Securing-Microservices-Architecture/middlewares/authMiddleware');
const {validateLoginInput, validateUserProfileInput, checkValidationResults} = require ('../Securing-Microservices-Architecture/middlewares/inputValidation');
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

const users = []

function generateAccessToken(user){
    const payload = {
        id: user.id,
        role: user.role
    };
    
    const token = jwt.sign(payload, 'secretKey', { expiresIn: "1h" });
    
    return token;
}

app.post('/login', validateLoginInput, checkValidationResults, rateLimit,async(req, res) => {
    const { username, password} = req.body;
    const user = users.find(user => user.email === username);

    if (!user){
        return res.status(403).json({
            error: "no user found",
        });
    }

    if(user.password !== password){
        return res.status(403).json({
            error: "incorrect password",
        });
    }
    
    delete user.password;

    const token = generateAccessToken(user);
    res.cookie("token", token, {
        httpOnly: true,
    });

    return res.status(200).json({
        message: "Login successful",
        role: user.role,
        token: token
    })
});

app.get('/all', authenticateToken, authPage(["admin"]), rateLimit, (req, res) => {
    if(users.length === 0) {
        return res.status(404).json({ message: 'No users found' });
    } else {
        return res.status(200).json({data: users});
    }
});

app.get('/user/:id', authenticateToken, authPage(["admin"]), rateLimit,(req, res) => {
    const user = users.find(user => user.id === parseInt(req.params.id));
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    } else {
        return res.status(200).json({data: user});
    }
});

app.post('/add-user', validateUserProfileInput, checkValidationResults,rateLimit,(req, res) => {
    const {name, email, password, role} = req.body;
    const user = {
        id: users.length + 1,
        name,
        email,
        password,
        role
    }

    users.push(user);
    return res.status(201).json({message: "User added successfully", customer_id: user.id, customer_name: user.name});
});

app.put('/update-user/:id', authenticateToken, authPage(["customer", "admin"]), rateLimit,(req, res) => {
    const {id} = req.params;
    const {name, email} = req.body;
    const user = users.find(user => user.id === parseInt(req.params.id));
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    } 

    user.name = name;
    user.email = email;

    return res.status(200).json({message: "User updated successfully", customer_id: user.id, customer_name: user.name});
});

app.delete('/delete-user/:id', authenticateToken, authPage(["admin"]), rateLimit, (req, res) => {
    const {id} = req.params;
    const user = users.find(user => user.id === parseInt(id));
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    users.splice(users.indexOf(user), 1);
    return res.status(200).json({message: "User deleted successfully"});
});


sslServer.listen(3002, () => {
    console.log('User service started on port 3002');
});