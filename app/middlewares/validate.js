//app/middlewares/validate.js
const Joi = require('joi');

module.exports = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            // Check if this is an API request or web request
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            } else {
                req.flash('error_msg', 'Please check your input and try again.');
                req.flash('old_input', req[property]);
                req.flash('validation_errors', errors);
                return res.redirect('back');
            }
        }

        // If validation passes, sanitize the data
        if (property === 'body') {
            // Sanitize string inputs
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();

                    // Prevent XSS
                    req.body[key] = req.body[key]
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#x27;');
                }
            });
        }

        next();
    };
};