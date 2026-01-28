// app/middlewares/rateLimiter.js
const rateLimiters = require('../../utils/rateLimiter');

// Apply rate limiting based on routes
const applyRateLimiting = (app) => {
    app.use('/auth/register', rateLimiters.strict);
    app.use('/auth/login', rateLimiters.strict);
    app.use('/auth/forgot-password', rateLimiters.strict);
    app.use('/auth/reset-password', rateLimiters.strict);

    app.use('/api', rateLimiters.general);

    app.use('/api/admin', rateLimiters.roleBasedRateLimit());
    app.use('/api/hr', rateLimiters.roleBasedRateLimit());
    app.use('/api/employee', rateLimiters.roleBasedRateLimit());

    app.use('/dashboard', rateLimiters.createLimiter(15 * 60 * 1000, 300));
    app.use('/profile', rateLimiters.createLimiter(15 * 60 * 1000, 200));

    app.use('/api/attendance/check-in', rateLimiters.userRateLimit(10, 60 * 1000));
    app.use('/api/attendance/check-out', rateLimiters.userRateLimit(10, 60 * 1000));

    app.use('/api/leaves/apply', rateLimiters.userRateLimit(5, 60 * 60 * 1000));
    app.use('/api/expenses/submit', rateLimiters.userRateLimit(10, 60 * 60 * 1000));

    // FIXED
    app.use('/api/reports', rateLimiters.userRateLimit(5, 60 * 60 * 1000));
    app.use('/api/upload', rateLimiters.userRateLimit(20, 60 * 60 * 1000));
    app.use('/api/admin/bulk', rateLimiters.userRateLimit(2, 60 * 60 * 1000));
};


// Rate limiting response handler
const rateLimitHandler = (err, req, res, next) => {
    if (err && err.status === 429) {
        // Check if this is an API request or web request
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
                retryAfter: Math.ceil(err.msBeforeNext / 1000) || 60
            });
        } else {
            req.flash('error_msg', 'Too many requests. Please try again later.');
            return res.redirect('back');
        }
    }
    next(err);
};

// Rate limiting for specific IP addresses (for blocking suspicious IPs)
const suspiciousIPRateLimit = (app) => {
    const suspiciousIPs = new Set(); // In production, use Redis or database

    app.use((req, res, next) => {
        const ip = req.ip;

        if (suspiciousIPs.has(ip)) {
            return rateLimiters.createLimiter(60 * 60 * 1000, 10)(req, res, next);
        }

        next();
    });
};

module.exports = {
    applyRateLimiting,
    rateLimitHandler,
    suspiciousIPRateLimit,
    ...rateLimiters
};