// config/app.js
const express = require('express');
const morgan = require("morgan");
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"]
        }
    }
}));

//method-override express-ejs-layouts morgan cookie-parser cors
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(methodOverride("_method"));
app.use(expressLayouts);

app.use(cors());

app.use(express.static(path.join(__dirname, '../assets')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../app/views'));
app.set('layout', 'layouts/application');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.warning_msg = req.flash('warning_msg');
    res.locals.info_msg = req.flash('info_msg');
    res.locals.old_input = req.flash('old_input')[0] || {};
    res.locals.user = req.user || null;
    res.locals.currentUrl = req.originalUrl;

    res.locals.js = '';
    res.locals.css = '';
    res.locals.body = '';
    res.locals.subtitle = '';
    res.locals.noNavbar = false;
    res.locals.noFooter = false;
    res.locals.noPageTitle = true;
    res.locals.containerClass = '';
    res.locals.actionButtons = null;
    res.locals.appName = 'HR Management System';
    res.locals.description = 'A comprehensive HR Management System';

    next();
});

// Rate limiting
const { applyRateLimiting, rateLimitHandler } = require('../app/middlewares/rateLimiter');
applyRateLimiting(app);

// Request logging
const { requestLogger, errorLogger } = require('../app/middlewares/logger');
app.use(requestLogger);

// Load routes
const loadRoutes = require('../app/routes/application.routes');
loadRoutes(app);

// Error handling
app.use(errorLogger);
app.use(rateLimitHandler);

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.json({
            success: false,
            message: 'An unexpected error occurred',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } else {
        res.render('error/500', {
            title: 'Error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});


module.exports = app;