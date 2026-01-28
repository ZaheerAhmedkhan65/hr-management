// utils/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');

// Create Redis client (optional, falls back to memory store)
let redisClient;
try {
    redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (err) => {
        console.warn('Redis connection error, using memory store:', err.message);
        redisClient = null;
    });
} catch (error) {
    console.warn('Redis not available, using memory store:', error.message);
    redisClient = null;
}

// Rate limit configurations
const rateLimiters = {
    // Strict rate limiter for sensitive endpoints (login, register, password reset)
    strict: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per windowMs
        message: {
            success: false,
            message: 'Too many attempts, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Don't count successful requests
        store: redisClient ? new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
        }) : undefined
    }),

    // General API rate limiter
    general: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
            success: false,
            message: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),

    // Public endpoints rate limiter (more generous)
    public: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 1000, // Limit each IP to 1000 requests per hour
        message: {
            success: false,
            message: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),

    // Create custom rate limiter
    createLimiter: (windowMs, max, message = null) => {
        return rateLimit({
            windowMs,
            max,
            message: message || {
                success: false,
                message: 'Too many requests, please try again later'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
    }
};

// Rate limiting by user ID (for authenticated users)
const userRateLimit = (maxRequests, windowMs = 15 * 60 * 1000) => {
    const userLimits = new Map();

    return (req, res, next) => {
        if (!req.user || !req.user.id) {
            return next(); // No user, skip user-based rate limiting
        }

        const userId = req.user.id;
        const now = Date.now();

        if (!userLimits.has(userId)) {
            userLimits.set(userId, { count: 1, resetTime: now + windowMs });
            setTimeout(() => userLimits.delete(userId), windowMs);
            return next();
        }

        const userLimit = userLimits.get(userId);

        if (now > userLimit.resetTime) {
            // Reset window
            userLimits.set(userId, { count: 1, resetTime: now + windowMs });
            setTimeout(() => userLimits.delete(userId), windowMs);
            return next();
        }

        if (userLimit.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: `Rate limit exceeded. Try again in ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds`
            });
        }

        userLimit.count++;
        next();
    };
};

// Rate limiting by endpoint
const endpointRateLimit = (endpointMaxRequests = new Map()) => {
    const endpointCounts = new Map();

    return (req, res, next) => {
        const endpoint = req.path;
        const maxRequests = endpointMaxRequests.get(endpoint) || 100; // Default 100
        const windowMs = 15 * 60 * 1000; // 15 minutes

        const key = `${endpoint}:${req.ip}`;
        const now = Date.now();

        if (!endpointCounts.has(key)) {
            endpointCounts.set(key, { count: 1, resetTime: now + windowMs });
            setTimeout(() => endpointCounts.delete(key), windowMs);
            return next();
        }

        const endpointLimit = endpointCounts.get(key);

        if (now > endpointLimit.resetTime) {
            endpointCounts.set(key, { count: 1, resetTime: now + windowMs });
            setTimeout(() => endpointCounts.delete(key), windowMs);
            return next();
        }

        if (endpointLimit.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: `Rate limit exceeded for ${endpoint}. Try again later.`
            });
        }

        endpointLimit.count++;
        next();
    };
};

// Dynamic rate limiting based on user role
const roleBasedRateLimit = () => {
    const limits = {
        admin: 1000, // Admin gets higher limits
        hr: 500,     // HR gets medium limits
        employee: 100 // Employees get basic limits
    };

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return rateLimiters.general(req, res, next);
        }

        const userRole = req.user.role;
        const maxRequests = limits[userRole] || 100;

        return rateLimiters.createLimiter(15 * 60 * 1000, maxRequests)(req, res, next);
    };
};

// Export rate limiters
module.exports = {
    ...rateLimiters,
    userRateLimit,
    endpointRateLimit,
    roleBasedRateLimit
};