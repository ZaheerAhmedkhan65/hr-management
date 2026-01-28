// app/validations/leave.validation.js
const Joi = require('joi');

exports.applyLeave = Joi.object({
    leave_type: Joi.string().valid('sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid').required(),
    start_date: Joi.date().min('now').required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
    reason: Joi.string().min(5).max(500).required()
});

exports.updateStatus = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    notes: Joi.string().max(500).optional()
});

exports.getLeaves = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected', 'all').default('all'),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    leave_type: Joi.string().valid('sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});