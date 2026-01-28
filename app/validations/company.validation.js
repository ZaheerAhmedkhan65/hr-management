//app/validations/company.validation.js
const Joi = require('joi');

exports.createCompany = Joi.object({
    company_name: Joi.string().min(2).max(255).required(),
    company_email: Joi.string().email().required(),
    company_phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    address: Joi.string().min(5).required(),
    industry: Joi.string().optional(),
    tax_id: Joi.string().optional(),
    registration_number: Joi.string().optional()
});

exports.updateCompany = Joi.object({
    company_name: Joi.string().min(2).max(255).optional(),
    company_email: Joi.string().email().optional(),
    company_phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().min(5).optional(),
    industry: Joi.string().optional(),
    tax_id: Joi.string().optional(),
    registration_number: Joi.string().optional()
});

exports.updateStatus = Joi.object({
    status: Joi.string().valid('active', 'inactive').required()
});

exports.updateSubscription = Joi.object({
    plan: Joi.string().valid('free', 'basic', 'premium').required(),
    expiry: Joi.date().greater('now').optional()
});

exports.searchCompanies = Joi.object({
    status: Joi.string().valid('active', 'inactive').optional(),
    plan: Joi.string().valid('free', 'basic', 'premium').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});