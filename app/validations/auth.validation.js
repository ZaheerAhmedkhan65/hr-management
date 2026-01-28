// app/validations/auth.validation.js
const Joi = require('joi');

exports.register = Joi.object({
    company_name: Joi.string().min(2).max(255).required(),
    company_email: Joi.string().email().required(),
    company_phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    address: Joi.string().min(5).required(),
    industry: Joi.string().optional(),
    tax_id: Joi.string().optional(),
    registration_number: Joi.string().optional(),

    // Admin user data
    first_name: Joi.string().min(2).max(100).required(),
    last_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().optional()
});

exports.login = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

exports.changePassword = Joi.object({
    current_password: Joi.string().min(6).required(),
    new_password: Joi.string().min(6).required(),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
});

exports.forgotPassword = Joi.object({
    email: Joi.string().email().required()
});

exports.resetPassword = Joi.object({
    token: Joi.string().required(),
    new_password: Joi.string().min(6).required(),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
});

exports.updateProfile = Joi.object({
    first_name: Joi.string().min(2).max(100).optional(),
    last_name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().optional(),
    profile_image: Joi.string().uri().optional()
});