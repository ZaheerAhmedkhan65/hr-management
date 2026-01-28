//app/validations/user.validation.js
const Joi = require('joi');

exports.createUser = Joi.object({
    first_name: Joi.string().min(2).max(100).required(),
    last_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().optional(),
    role: Joi.string().valid('employee', 'hr', 'admin').default('employee'),
    department_id: Joi.number().integer().positive().optional(),
    position: Joi.string().max(100).required(),
    salary: Joi.number().positive().required(),
    bonus: Joi.number().min(0).default(0),
    hire_date: Joi.date().max('now').default(() => new Date()),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active')
});

exports.updateUser = Joi.object({
    first_name: Joi.string().min(2).max(100).optional(),
    last_name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().optional(),
    role: Joi.string().valid('employee', 'hr', 'admin').optional(),
    department_id: Joi.number().integer().positive().optional(),
    position: Joi.string().max(100).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

exports.updateSalary = Joi.object({
    salary: Joi.number().positive().required(),
    bonus: Joi.number().min(0).optional()
});

exports.updateRole = Joi.object({
    role: Joi.string().valid('employee', 'hr', 'admin').required()
});

exports.resetPassword = Joi.object({
    new_password: Joi.string().min(6).required(),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
});

exports.searchUsers = Joi.object({
    search: Joi.string().min(1).optional(),
    role: Joi.string().valid('employee', 'hr', 'admin').optional(),
    department: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});