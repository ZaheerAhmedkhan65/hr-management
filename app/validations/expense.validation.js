// app/validations/expense.validation.js
const Joi = require('joi');

exports.submitExpense = Joi.object({
    expense_type: Joi.string().max(100).required(),
    description: Joi.string().min(5).max(500).required(),
    amount: Joi.number().positive().required(),
    receipt_image: Joi.string().uri().optional(),
    expense_date: Joi.date().max('now').default(() => new Date())
});

exports.updateExpense = Joi.object({
    expense_type: Joi.string().max(100).optional(),
    description: Joi.string().min(5).max(500).optional(),
    amount: Joi.number().positive().optional(),
    receipt_image: Joi.string().uri().optional(),
    expense_date: Joi.date().max('now').optional()
});

exports.updateStatus = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required()
});

exports.getExpenses = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected', 'all').default('all'),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    expense_type: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});