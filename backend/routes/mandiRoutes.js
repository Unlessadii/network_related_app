const express = require('express');
const router = express.Router();
const MandiController = require('../controllers/mandiController');

router.get('/mandi-prices', MandiController.getMandiPrices);

module.exports = router;
