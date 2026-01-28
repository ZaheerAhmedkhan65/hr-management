// app/middlewares/authorize.js

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. User not authenticated.'
            });
        }

        const userRole = req.user.role;

        // Check if user role is in allowed roles
        if (!allowedRoles.includes(userRole)) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            } else {
                req.flash('error_msg', 'You do not have permission to access this page.');
                return res.redirect('/dashboard');
            }
        }

        // Additional permission checks based on user role
        switch (userRole) {
            case 'admin':
                break;

            case 'hr':
                if (req.params.companyId && req.params.companyId !== req.user.companyId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. You can only access your company data.'
                    });
                }
                break;

            case 'employee':
                if (req.params.userId && req.params.userId !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. You can only access your own data.'
                    });
                }
                break;
        }

        next();
    };
};

const canAccessUser = (req, res, next) => {
    const requestedUserId = req.params.userId || req.body.user_id;
    const user = req.user;

    if (!requestedUserId) {
        return next();
    }

    if (user.role === 'admin') return next();

    if (user.role === 'hr') return next();

    if (user.role === 'employee' && user.id.toString() === requestedUserId.toString()) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot access this resource.'
    });
};

const isCompanyMember = (req, res, next) => {
    const requestedCompanyId = req.params.companyId || req.body.company_id;
    const user = req.user;

    if (!requestedCompanyId) {
        return next();
    }

    if (user.role === 'admin') return next();

    if (user.companyId && user.companyId.toString() === requestedCompanyId.toString()) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot access this company data.'
    });
};

module.exports = {
    authorize,
    canAccessUser,
    isCompanyMember
};
