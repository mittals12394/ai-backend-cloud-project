const express = require('express');
const AppError = require('../utils/AppError');
const router = express.Router();

const { getHealth, getVersion } = require('../controllers/healthController');
const validate = require('../middleware/validate');
const { createUserSchema } = require('../validators/userValidator');

// Routes
router.get('/health', getHealth);
router.get('/version', getVersion);

router.get('/user/:id', (req, res) => {
    const userId = req.params;
    const query = req.query;

    res.json({
        userId,
        query
    });
});

router.get('/error', (req, res, next) => {
    next(new AppError("Custom error example", 400));
})

module.exports = router;
