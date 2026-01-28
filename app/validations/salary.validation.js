// app/validations/salary.validation.js
const Joi = require('joi');

exports.generateSalary = Joi.object({
    user_id: Joi.number().integer().positive().required(),
    month: Joi.string().pattern(/^\d{6}$/).required(), // YYYYMM format
    basic_salary: Joi.number().positive().optional(),
    bonus: Joi.number().min(0).optional(),
    deductions: Joi.number().min(0).default(0),
    total_amount: Joi.number().positive().optional(),
    notes: Joi.string().max(500).optional()
});

exports.updateSalary = Joi.object({
    basic_salary: Joi.number().positive().optional(),
    bonus: Joi.number().min(0).optional(),
    deductions: Joi.number().min(0).optional(),
    total_amount: Joi.number().positive().optional(),
    notes: Joi.string().max(500).optional()
});

exports.updateStatus = Joi.object({
    status: Joi.string().valid('pending', 'paid', 'partially_paid').required(),
    payment_date: Joi.date().optional()
});

exports.getSalaries = Joi.object({
    month: Joi.string().pattern(/^\d{6}$/).optional(),
    status: Joi.string().valid('pending', 'paid', 'partially_paid', 'all').default('all'),
    user_id: Joi.number().integer().positive().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

exports.bulkGenerate = Joi.object({
    month: Joi.string().pattern(/^\d{6}$/).required(),
    department_id: Joi.number().integer().positive().optional()
});