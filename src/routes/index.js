const express = require('express');
const router = express.Router();

const { getHealth, getVersion } = require('../controllers/healthController');

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

module.exports = router;
