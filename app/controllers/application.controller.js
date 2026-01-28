//app/controllers/application.controller.js
class ApplicationController{
    
    constructor(service) {
        this.service = service;
    }

    // Success response
    success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    // Error response
    error(res, message = 'Error', statusCode = 400, errors = null) {
        const response = {
            success: false,
            message
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    // Pagination helper
    paginate(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        return { page, limit, offset };
    }

    // Sort helper
    sort(req, defaultSort = 'created_at', defaultOrder = 'DESC') {
        const sort = req.query.sort || defaultSort;
        const order = req.query.order || defaultOrder;

        return { sort, order };
    }

    // service errors
    handleError(res, error) {
        console.error('Controller error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return this.error(res, 'Duplicate entry found', 409);
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return this.error(res, 'Referenced data not found', 404);
        }

        if (error.name === 'ValidationError') {
            return this.error(res, 'Validation failed', 400, error.errors);
        }

        return this.error(res, 'Internal server error', 500);
    }

    // file uploads
    handleFileUpload(req) {
        if (req.file) {
            return `/uploads/${req.file.filename}`;
        }
        return null;
    }
}

module.exports = ApplicationController;
