const express = require('express');
const router = express.Router();
const MarketplaceController = require('../controllers/marketplaceController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/marketplace', MarketplaceController.getListings);
router.get('/marketplace/:id', MarketplaceController.getListingById);
router.post('/marketplace', optionalAuth, MarketplaceController.createListing);

module.exports = router;
