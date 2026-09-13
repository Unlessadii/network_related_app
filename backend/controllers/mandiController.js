const MandiService = require('../services/mandiService');
const { successResponse, errorResponse } = require('../utils/helpers');

const MandiController = {
  async getMandiPrices(req, res) {
    try {
      const { crop, mandi, district, state, search } = req.query;
      const result = await MandiService.getPrices({ crop, mandi, district, state, search });

      return successResponse(res, {
        prices: result.prices,
        last_updated: result.lastUpdated,
        external_feed_connected: result.isExternalConnected
      }, 'Mandi commodity prices retrieved', 200, {
        total: result.count,
        cached: true,
        source: 'Agmarknet / e-NAM APMC Mandi Directorate'
      });
    } catch (err) {
      console.error('[MandiController.getMandiPrices]', err);
      return errorResponse(res, 'Failed to retrieve mandi prices', 500);
    }
  }
};

module.exports = MandiController;
