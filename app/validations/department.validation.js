// app/validations/department.validation.js
const Joi = require('joi');

exports.createDepartment = Joi.object({
    department_name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    manager_id: Joi.number().integer().positive().optional()
});

exports.updateDepartment = Joi.object({
    department_name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    manager_id: Joi.number().integer().positive().optional()
});

exports.updateManager = Joi.object({
    manager_id: Joi.number().integer().positive().required()
});

exports.reassignEmployees = Joi.object({
    new_department_id: Joi.number().integer().positive().required()
});