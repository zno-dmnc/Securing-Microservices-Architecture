const { body, validationResult } = require('express-validator');

const validateLoginInput = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const validateUserProfileInput = [
    body('name').notEmpty().withMessage('Username is required').trim().escape(),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address').trim().escape(),
    body('password').notEmpty().withMessage('Password is required').trim().escape(),
    body('role').isIn(['admin', 'customer']).withMessage('User role must be either "admin" or "customer"').trim().escape(),
];

const validateProductInput = [
    body('name').notEmpty().withMessage('Product name is required').trim().escape(),
    body('quantity').notEmpty().withMessage('Product quantity is required').trim().escape(),
    body('quantity').isInt().withMessage('Product quantity must be an integer').trim().escape(),
];

const validateProductEditInput = [
    body('quantity').isInt().withMessage('Product quantity must be an integer').trim().escape(),
];

const validateDeleteProductInput = [
    body('id').notEmpty().withMessage('Product ID is required').trim().escape(),
    body('id').isInt().withMessage('Product ID must be an integer').trim().escape(),
];

const validateNewOrdersInput = [
    body('customerID').notEmpty().withMessage('Customer ID is required').trim().escape(),
    body('productID').notEmpty().withMessage('Product ID is required').trim().escape(),
    body('quantity').notEmpty().withMessage('Product Quantity is required').trim().escape(),
];

const validateEditOrdersInput = [
    body('customerID').notEmpty().withMessage('Customer ID is required').trim().escape(),
    body('productID').notEmpty().withMessage('Product ID is required').trim().escape(),
    body('quantity').notEmpty().withMessage('Product Quantity is required').trim().escape(),
];


const validateDeleteOrdersInput = [
    body('id').notEmpty().withMessage('Order ID is required').trim().escape(),
    body('id').isInt().withMessage('Order ID must be an integer').trim().escape(),
];


const checkValidationResults = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    next();
};



module.exports = {
    validateLoginInput,
    validateUserProfileInput,
    validateProductInput,
    validateNewOrdersInput,
    validateEditOrdersInput,
    validateProductEditInput,
    validateDeleteProductInput,
    validateDeleteOrdersInput,
    checkValidationResults,
};