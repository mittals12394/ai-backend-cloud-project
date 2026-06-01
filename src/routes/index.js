const express = require('express');
const AppError = require('../utils/AppError');
const router = express.Router();

const { getHealth, getVersion } = require('../controllers/healthController');
const validate = require('../middleware/validate');
const { createUserSchema } = require('../validators/userValidator');
const userController = require('../controllers/userController');

// Routes
router.get('/health', getHealth);
router.get('/version', getVersion);

router.post('/users', validate(createUserSchema), userController.createUser); 
router.get('/users', userController.getUsers); 
router.get('/users/:id', userController.getUser); 
router.put('/users/:id', userController.updateUser); 
router.delete('/users/:id', userController.deleteUser);

router.get('/error', (req, res, next) => {
    next(new AppError("Custom error example", 400));
})

module.exports = router;
