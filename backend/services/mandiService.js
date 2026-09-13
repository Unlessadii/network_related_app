const config = require('../config/env');
const MandiPrice = require('../models/MandiPrice');

const MandiService = {
  async getPrices(filters = {}) {
    // If external Mandi API is configured, attempt fetch with short timeout
    if (config.MANDI_API_URL && config.MANDI_API_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const url = new URL(config.MANDI_API_URL);
        if (filters.crop) url.searchParams.set('crop', filters.crop);
        if (filters.district) url.searchParams.set('district', filters.district);
        url.searchParams.set('api_key', config.MANDI_API_KEY);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeout);

        if (response.ok) {
          const externalData = await response.json();
          if (Array.isArray(externalData) && externalData.length > 0) {
            // Upsert records into database cache
            for (const item of externalData) {
              MandiPrice.upsert({
                crop: item.commodity || item.crop,
                crop_hi: item.commodity_hi || item.crop_hi || item.crop,
                mandi: item.market || item.mandi,
                district: item.district,
                state: item.state,
                min_price: item.min_price || item.minPrice,
                max_price: item.max_price || item.maxPrice,
                modal_price: item.modal_price || item.modalPrice,
                arrival_date: item.arrival_date || item.date,
                source: 'e-NAM / External APMC Feed'
              });
            }
          }
        }
      } catch (err) {
        console.warn('[MandiService] External API fetch failed or timed out. Serving local verified cache:', err.message);
      }
    }

    // Return current database state (cached & verified)
    const prices = MandiPrice.listAll(filters);
    const lastUpdated = MandiPrice.lastUpdated();
    return {
      prices,
      lastUpdated,
      count: prices.length,
      isExternalConnected: Boolean(config.MANDI_API_URL && config.MANDI_API_KEY)
    };
  }
};

module.exports = MandiService;
