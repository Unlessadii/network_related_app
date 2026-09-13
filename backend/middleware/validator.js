const { errorResponse } = require('../utils/helpers');

function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(schema)) {
      const val = req.body ? req.body[field] : undefined;

      if (rule.required && (val === undefined || val === null || val === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (val !== undefined && val !== null && val !== '') {
        if (rule.type === 'string' && typeof val !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (rule.type === 'number' && typeof val !== 'number' && isNaN(Number(val))) {
          errors.push(`${field} must be a valid number`);
        } else if (rule.min && String(val).length < rule.min) {
          errors.push(`${field} must be at least ${rule.min} characters`);
        } else if (rule.enum && !rule.enum.includes(val)) {
          errors.push(`${field} must be one of: [${rule.enum.join(', ')}]`);
        }
      }
    }

    if (errors.length > 0) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }
    next();
  };
}

module.exports = { validateBody };
