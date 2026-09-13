const Scheme = require('../models/Scheme');
const { successResponse, errorResponse } = require('../utils/helpers');

const SchemeController = {
  async getSchemes(req, res) {
    const { category, search } = req.query;
    const schemes = Scheme.listAll({ category, search });
    return successResponse(res, { schemes, count: schemes.length });
  },

  async getSchemeById(req, res) {
    const { id } = req.params;
    const scheme = Scheme.findById(id);
    if (!scheme) return errorResponse(res, 'Government scheme not found', 404);
    return successResponse(res, { scheme });
  }
};

module.exports = SchemeController;
