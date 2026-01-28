// app/services/application.service.js
class ApplicationService {
    success(data, message = 'Success') {
        return { success: true, message, data };
    }

    error(message = 'Error', data = null) {
        return { success: false, message, data };
    }
}

module.exports = ApplicationService;