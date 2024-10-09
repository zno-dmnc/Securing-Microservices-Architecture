const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');

app.use(express.json());
const users = [];
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
            return res.status(403).json({message: 'Invalid Token!'});
        }
        req.user = user;
        next();
    });
};

const authRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if(!allowedRoles.includes(userRole)) {
            return res.status(403).json({message: 'Access Denied: Insufficient privileges!'});
        }
        next();
    };
};

app.post('/login', (req, res) => {
    const {username, password} = req.body;

    const user = users.find(u => u.username === username);
    if(user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({username: user.username, role: user.role}, secretKey, {expiresIn: '1h'});
        return res.status(200).json({token});
    }
    return res.status(401).json({message: 'Error! Invalid username or password.'});
});

app.post('/register', (req, res) => {
    const {username, password, role} = req.body;
    if(!username || !password || !role) {
        return res.status(400).json({message: 'Please provide username, password, and role.'});
    }

    const existingUser = users.find(user => user.username === username);
    if(existingUser) {
        return res.status(400).json({message: 'User already exists.'});
    }

    const hashedPass = bcrypt.hashSync(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hashedPass,
        role,
    };

    users.push(newUser);
    return res.status(201).json({message: 'User registered successfully.', data: newUser});
});

app.get('/users', authenJWT, authRole(['admin', 'user']), (req, res) => {
    if(users.length === 0) {
        return res.status(404).json({message: 'No users found.'});
    }
    return res.status(200).json({data:users});
});

app.get('/users/:id', authenJWT, authRole(['admin', 'user']), (req, res) => {
    const {id} = req.params;
    const user = users.find((u) => u.id === Number(id));
    if(!user){
        return res.status(404).json({message: 'User not found.'});
    }
    return res.status(200).json({data: user});
});

app.put('/update-user/:id', authenJWT, authRole(['admin']), (req, res) => {
    const {id} = req.params;
    const {username, password} = req.body;
    const user = users.find((u) => u.id === Number(id));
    if(!user){
        return res.status(404).json({message: 'User not found.'});
    }
    if(username){
        user.username = username;
    }
    if(password){
        user.password = bcrypt.hashSync(password, 10);
    }
    return res.status(200).json({message: 'User updated successfully.', data: user})
})

app.delete('/delete-user/:id', authenJWT, authRole(['admin']), (req, res) => {
    const {id} = req.params;
    const user = users.find((u) => u.id === Number(id));
    if(!user){
        return res.status(404).json({message: 'User not found'});
    }
    users.splice(users.indexOf(user), 1);
    return res.status(200).json({message: 'User deleted successfully.'});
});

app.listen(3002, () => {
    console.log('Server is running on port 3002.');
});