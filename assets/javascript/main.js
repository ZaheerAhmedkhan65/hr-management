// Main JavaScript file for HR Management System

$(document).ready(function () {
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Initialize popovers
    $('[data-bs-toggle="popover"]').popover();

    // Auto-dismiss alerts after 5 seconds
    setTimeout(function () {
        $('.alert').alert('close');
    }, 5000);

    // Confirm action on delete buttons
    $('.confirm-action').click(function (e) {
        e.preventDefault();
        const message = $(this).data('confirm') || 'Are you sure you want to perform this action?';
        const actionUrl = $(this).attr('href');

        if (confirm(message)) {
            window.location.href = actionUrl;
        }
    });

    // Toggle password visibility
    $('.toggle-password').click(function () {
        const input = $(this).closest('.input-group').find('input');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).find('i').toggleClass('fa-eye fa-eye-slash');
    });

    // Auto-format phone numbers
    $('input[type="tel"]').on('input', function () {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 10) value = value.substring(0, 10);

        if (value.length >= 6) {
            value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
        } else if (value.length >= 3) {
            value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }

        $(this).val(value);
    });

    // Auto-format currency
    $('.currency-input').on('input', function () {
        let value = $(this).val().replace(/[^0-9.]/g, '');
        const parts = value.split('.');

        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        if (value !== '') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                $(this).val(num.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }));
            }
        }
    });

    // Form validation
    $('form').submit(function () {
        // Clear previous validation states
        $(this).find('.is-invalid').removeClass('is-invalid');
        $(this).find('.invalid-feedback').remove();

        let valid = true;

        // Check required fields
        $(this).find('[required]').each(function () {
            if (!$(this).val().trim()) {
                $(this).addClass('is-invalid');
                $(this).after('<div class="invalid-feedback">This field is required.</div>');
                valid = false;
            }
        });

        // Email validation
        $(this).find('input[type="email"]').each(function () {
            const email = $(this).val();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (email && !emailRegex.test(email)) {
                $(this).addClass('is-invalid');
                $(this).after('<div class="invalid-feedback">Please enter a valid email address.</div>');
                valid = false;
            }
        });

        // Password confirmation
        const password = $(this).find('#password');
        const confirmPassword = $(this).find('#confirm_password');

        if (password.length && confirmPassword.length) {
            if (password.val() !== confirmPassword.val()) {
                confirmPassword.addClass('is-invalid');
                confirmPassword.after('<div class="invalid-feedback">Passwords do not match.</div>');
                valid = false;
            }
        }

        if (!valid) {
            // Scroll to first error
            const firstError = $(this).find('.is-invalid').first();
            if (firstError.length) {
                $('html, body').animate({
                    scrollTop: firstError.offset().top - 100
                }, 500);
            }

            return false;
        }

        return true;
    });

    // File upload preview
    $('input[type="file"]').change(function () {
        const file = this.files[0];
        const previewContainer = $(this).data('preview');

        if (previewContainer && file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $(previewContainer).html(`<img src="${e.target.result}" class="img-fluid" alt="Preview">`);
            };
            reader.readAsDataURL(file);
        }
    });

    // Date range picker
    if ($('.date-range-picker').length) {
        $('.date-range-picker').daterangepicker({
            opens: 'left',
            drops: 'down',
            showDropdowns: true,
            autoApply: true,
            locale: {
                format: 'YYYY-MM-DD',
                separator: ' to ',
                applyLabel: 'Apply',
                cancelLabel: 'Cancel',
                fromLabel: 'From',
                toLabel: 'To',
                customRangeLabel: 'Custom',
                weekLabel: 'W',
                daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                monthNames: [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ],
                firstDay: 1
            }
        });
    }

    // Initialize Select2
    if ($.fn.select2) {
        $('.select2').select2({
            theme: 'bootstrap-5',
            width: '100%',
            placeholder: 'Select an option',
            allowClear: true
        });
    }

    // Initialize DataTables
    if ($.fn.DataTable) {
        $('.datatable').DataTable({
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)",
                zeroRecords: "No matching records found",
                paginate: {
                    first: "First",
                    last: "Last",
                    next: "Next",
                    previous: "Previous"
                }
            },
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                '<"row"<"col-sm-12"tr>>' +
                '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>'
        });
    }

    // Auto-save forms
    let autoSaveTimer;
    $('.auto-save').on('input', function () {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(function () {
            $('.auto-save-form').submit();
        }, 2000);
    });

    // Copy to clipboard
    $('.copy-to-clipboard').click(function () {
        const text = $(this).data('clipboard-text');
        navigator.clipboard.writeText(text).then(function () {
            // Show success message
            const originalText = $(this).html();
            $(this).html('<i class="fas fa-check"></i> Copied!');

            setTimeout(() => {
                $(this).html(originalText);
            }, 2000);
        }).catch(function (err) {
            console.error('Failed to copy: ', err);
        });
    });

    // Load more functionality
    $('.load-more').click(function () {
        const button = $(this);
        const url = button.data('url');
        const page = button.data('page') || 2;
        const target = button.data('target');

        button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');

        $.get(url, { page: page }, function (data) {
            if (data.html) {
                $(target).append(data.html);
                button.data('page', page + 1);

                if (!data.has_more) {
                    button.remove();
                }
            }
        }).always(function () {
            button.prop('disabled', false).html('Load More');
        });
    });

    // Real-time notifications
    function checkNotifications() {
        if (window.userId) {
            $.get('/api/notifications/unread-count', function (data) {
                if (data.count > 0) {
                    $('.notification-badge').text(data.count).show();
                } else {
                    $('.notification-badge').hide();
                }
            });
        }
    }

    // Check notifications every 30 seconds
    setInterval(checkNotifications, 30000);

    // Mark notification as read
    $('.notification-item').click(function () {
        const notificationId = $(this).data('id');
        if (notificationId) {
            $.post(`/api/notifications/${notificationId}/read`);
        }
    });

    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }

    // Keyboard shortcuts
    $(document).keydown(function (e) {
        // Ctrl+K for search
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            $('#searchModal').modal('show');
            $('#globalSearch').focus();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            $('.modal').modal('hide');
        }
    });

    // Initialize image preview
    $('.image-preview').click(function () {
        const src = $(this).attr('src');
        $('#imagePreview').attr('src', src);
        $('#imagePreviewModal').modal('show');
    });
});

// Initialize charts
function initializeCharts() {
    // Example chart initialization
    $('.chart-container').each(function () {
        const canvas = $(this).find('canvas');
        const chartType = canvas.data('type') || 'line';
        const chartData = canvas.data('chart') || {};

        if (chartData && chartData.labels && chartData.datasets) {
            new Chart(canvas, {
                type: chartType,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    });
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format time
function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for use in other scripts
window.HRMS = {
    formatDate,
    formatTime,
    formatCurrency,
    debounce,
    throttle,
    initializeCharts
};