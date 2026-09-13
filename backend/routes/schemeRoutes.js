const express = require('express');
const router = express.Router();
const SchemeController = require('../controllers/schemeController');

router.get('/schemes', SchemeController.getSchemes);
router.get('/schemes/:id', SchemeController.getSchemeById);

module.exports = router;
