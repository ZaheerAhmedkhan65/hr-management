// app/validations/attendance.validation.js
const Joi = require('joi');

exports.checkIn = Joi.object({
    check_in: Joi.date().optional()
});

exports.checkOut = Joi.object({
    check_out: Joi.date().optional()
});

exports.markAttendance = Joi.object({
    user_id: Joi.number().integer().positive().required(),
    check_in: Joi.date().required(),
    check_out: Joi.date().optional(),
    total_hours: Joi.number().positive().max(24).optional(),
    status: Joi.string().valid('present', 'absent', 'late', 'half-day', 'leave').default('present'),
    notes: Joi.string().max(500).optional()
});

exports.updateStatus = Joi.object({
    status: Joi.string().valid('present', 'absent', 'late', 'half-day', 'leave').required(),
    notes: Joi.string().max(500).optional()
});

exports.getAttendance = Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
    user_id: Joi.number().integer().positive().optional()
});

exports.getReport = Joi.object({
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2000).max(2100).optional(),
    department_id: Joi.number().integer().positive().optional()
});