//app/middlewares/logger.js
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Request logger
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log after response is sent
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id || 'anonymous'
        };

        // Write to file
        const logFile = path.join(logsDir, 'requests.log');
        fs.appendFileSync(logFile, JSON.stringify(log) + '\n');

        // Console log for development
        console.log(`${log.timestamp} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
};

// Error logger
const errorLogger = (err, req, res, next) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        error: err.message,
        stack: err.stack,
        ip: req.ip,
        userId: req.user?.id || 'anonymous'
    };

    // Write to error log file
    const errorFile = path.join(logsDir, 'errors.log');
    fs.appendFileSync(errorFile, JSON.stringify(errorLog) + '\n');

    // Console error for development
    console.error(`${errorLog.timestamp} ERROR: ${err.message}`);
    console.error(err.stack);

    next(err);
};

// Activity logger for important actions
const activityLogger = (action, details = {}) => {
    return (req, res, next) => {
        const activityLog = {
            timestamp: new Date().toISOString(),
            action: action,
            userId: req.user?.id,
            userRole: req.user?.role,
            companyId: req.user?.companyId,
            ip: req.ip,
            details: details
        };

        // Write to activity log file
        const activityFile = path.join(logsDir, 'activities.log');
        fs.appendFileSync(activityFile, JSON.stringify(activityLog) + '\n');

        // Store in request for later use if needed
        req.activityLog = activityLog;

        next();
    };
};

module.exports = {
    requestLogger,
    errorLogger,
    activityLogger
};