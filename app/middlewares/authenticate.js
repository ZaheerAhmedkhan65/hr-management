// app/middlewares/authenticate.js
const jwt = require('../../utils/jwt');

module.exports = (req, res, next) => {
    try {
        // Check for token in multiple locations
        let token;

        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // Check cookie (for web views)
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Check query parameter (for file downloads, etc.)
        else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            // Check if this is an API request or web request
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            } else {
                req.flash('error_msg', 'Please login to continue');
                return res.redirect('/login');
            }
        }

        // Verify token
        const decoded = jwt.verify(token);
        if (!decoded) {
            throw new Error('Invalid token');
        }

        // Attach user to request
        req.user = decoded;
        req.token = token;

        next();
    } catch (error) {
        console.error('Authentication error:', error.message);

        // Clear invalid token cookie
        res.clearCookie('token');

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid or expired token.'
            });
        } else {
            req.flash('error_msg', 'Session expired. Please login again.');
            return res.redirect('/login');
        }
    }
};