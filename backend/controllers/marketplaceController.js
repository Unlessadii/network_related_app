const MarketplaceListing = require('../models/MarketplaceListing');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/helpers');

const MarketplaceController = {
  async getListings(req, res) {
    const { category, district, search } = req.query;
    const listings = MarketplaceListing.listAll({ category, district, search, status: 'active' });
    return successResponse(res, { listings, count: listings.length });
  },

  async getListingById(req, res) {
    const { id } = req.params;
    const listing = MarketplaceListing.findById(id);
    if (!listing) return errorResponse(res, 'Marketplace listing not found', 404);
    return successResponse(res, { listing });
  },

  async createListing(req, res) {
    try {
      const { client_id, title, category, price, unit, description, village, district, state, seller_name, seller_phone, image_url } = req.body;
      const userId = req.user ? req.user.id : (req.body.user_id || 'usr-farmer-001');

      if (!title || !price || !description || !village || !seller_phone) {
        return errorResponse(res, 'Title, price, description, village, and phone are required', 400);
      }

      const listing = MarketplaceListing.create({
        client_id,
        user_id: userId,
        title,
        category: category || 'General',
        price: Number(price),
        unit: unit || 'per item',
        description,
        village,
        district: district || (req.user ? req.user.district : 'Narmadapuram'),
        state: state || 'Madhya Pradesh',
        seller_name: seller_name || (req.user ? req.user.name : 'Villager'),
        seller_phone,
        image_url,
        status: 'active',
        sync_status: 'synced'
      });

      Notification.create({
        user_id: userId,
        title: 'Listing Published',
        message: `Your marketplace listing "${title}" is now active.`,
        type: 'success'
      });

      return successResponse(res, { listing }, 'Listing created successfully', 201);
    } catch (err) {
      console.error('[MarketplaceController.createListing]', err);
      return errorResponse(res, 'Failed to create marketplace listing', 500);
    }
  }
};

module.exports = MarketplaceController;
