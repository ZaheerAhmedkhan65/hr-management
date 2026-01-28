//app/controllers/public.controller.js
const ApplicationController = require('./application.controller');

class PublicController extends ApplicationController {
    constructor() {
        super(null);
    }

    // Home page
    async home(req, res) {
        try {
            // If user is logged in, redirect to dashboard
            if (req.user) {
                return res.redirect('/dashboard');
            }

            // Render home page
            return res.render('public/home', {
                title: 'HR Management System',
                noNavbar: false,
                noFooter: false,
                noPageTitle: false,
                description: 'Streamline your HR processes with our comprehensive management system'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // About page
    async about(req, res) {
        try {
            return res.render('public/about', {
                title: 'About Us',
                description: 'Learn more about our HR management system'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Contact page
    async contact(req, res) {
        try {
            return res.render('public/contact', {
                title: 'Contact Us',
                description: 'Get in touch with our team'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Contact form submission
    async contactSubmit(req, res) {
        try {
            const { name, email, subject, message } = req.body;

            // Validate form data
            if (!name || !email || !subject || !message) {
                req.flash('error_msg', 'Please fill in all fields');
                req.flash('old_input', req.body);
                return res.redirect('/contact');
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                req.flash('error_msg', 'Please enter a valid email address');
                req.flash('old_input', req.body);
                return res.redirect('/contact');
            }

            // Here you would typically:
            // 1. Save contact form to database
            // 2. Send email notification
            // 3. Send auto-reply to user

            // For now, just show success message
            req.flash('success_msg', 'Thank you for contacting us! We will get back to you soon.');
            return res.redirect('/contact');

        } catch (error) {
            req.flash('error_msg', 'Failed to submit contact form. Please try again.');
            return res.redirect('/contact');
        }
    }

    // Features page
    async features(req, res) {
        try {
            const features = [
                {
                    title: 'Attendance Management',
                    description: 'Track employee attendance with clock in/out, geo-fencing, and real-time monitoring.',
                    icon: 'fa-user-clock',
                    color: 'primary'
                },
                {
                    title: 'Leave Management',
                    description: 'Streamline leave requests with automated approval workflows and balance tracking.',
                    icon: 'fa-calendar-alt',
                    color: 'success'
                },
                {
                    title: 'Expense Management',
                    description: 'Submit, track, and approve expenses with receipt upload and categorization.',
                    icon: 'fa-file-invoice-dollar',
                    color: 'info'
                },
                {
                    title: 'Payroll Processing',
                    description: 'Automated salary processing with tax calculations and payslip generation.',
                    icon: 'fa-money-check-alt',
                    color: 'warning'
                },
                {
                    title: 'Employee Self-Service',
                    description: 'Employees can view and update their information, apply leaves, and more.',
                    icon: 'fa-user-cog',
                    color: 'danger'
                },
                {
                    title: 'Analytics & Reporting',
                    description: 'Powerful analytics dashboard with customizable reports and real-time insights.',
                    icon: 'fa-chart-bar',
                    color: 'purple'
                }
            ];

            return res.render('public/features', {
                title: 'Features',
                features: features,
                description: 'Discover all the features of our HR management system'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Pricing page
    async pricing(req, res) {
        try {
            const plans = [
                {
                    name: 'Free',
                    price: 0,
                    period: 'month',
                    features: [
                        'Up to 10 employees',
                        'Basic attendance tracking',
                        'Leave management',
                        'Email support',
                        '1 GB storage'
                    ],
                    buttonText: 'Get Started Free',
                    buttonClass: 'btn-outline-primary',
                    popular: false
                },
                {
                    name: 'Professional',
                    price: 49,
                    period: 'month',
                    features: [
                        'Up to 50 employees',
                        'Advanced attendance tracking',
                        'Expense management',
                        'Priority support',
                        '10 GB storage',
                        'Custom reports',
                        'API access'
                    ],
                    buttonText: 'Start Free Trial',
                    buttonClass: 'btn-primary',
                    popular: true
                },
                {
                    name: 'Enterprise',
                    price: 99,
                    period: 'month',
                    features: [
                        'Unlimited employees',
                        'Full feature access',
                        'Dedicated support',
                        '100 GB storage',
                        'Advanced analytics',
                        'Custom integrations',
                        'White-label option',
                        'SLA guarantee'
                    ],
                    buttonText: 'Contact Sales',
                    buttonClass: 'btn-outline-primary',
                    popular: false
                }
            ];

            return res.render('public/pricing', {
                title: 'Pricing',
                plans: plans,
                description: 'Choose the perfect plan for your organization'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // FAQ page
    async faq(req, res) {
        try {
            const faqs = [
                {
                    question: 'Is there a free trial available?',
                    answer: 'Yes, we offer a 14-day free trial for all our paid plans. No credit card is required to start your trial.'
                },
                {
                    question: 'Can I import existing employee data?',
                    answer: 'Absolutely! We provide CSV templates and bulk import functionality to easily migrate your existing employee data.'
                },
                {
                    question: 'Is the system mobile-friendly?',
                    answer: 'Yes, our system is fully responsive and works perfectly on all devices. We also have dedicated mobile apps for iOS and Android.'
                },
                {
                    question: 'How secure is my data?',
                    answer: 'We use industry-standard security measures including encryption, regular backups, and secure data centers. Your data is safe with us.'
                },
                {
                    question: 'Can I customize the system for my needs?',
                    answer: 'Yes, our Enterprise plan offers customization options including custom fields, workflows, and integrations.'
                },
                {
                    question: 'What kind of support do you offer?',
                    answer: 'We offer email support for all plans, priority support for Professional, and dedicated support for Enterprise customers.'
                }
            ];

            return res.render('public/faq', {
                title: 'Frequently Asked Questions',
                faqs: faqs,
                description: 'Find answers to common questions about our HR management system'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Privacy policy
    async privacy(req, res) {
        try {
            return res.render('public/privacy', {
                title: 'Privacy Policy',
                description: 'Learn how we protect and handle your data'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Terms of service
    async terms(req, res) {
        try {
            return res.render('public/terms', {
                title: 'Terms of Service',
                description: 'Read our terms and conditions'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // System status
    async status(req, res) {
        try {
            const systemStatus = {
                overall: 'operational',
                services: [
                    { name: 'Web Application', status: 'operational', uptime: '99.9%' },
                    { name: 'API Services', status: 'operational', uptime: '99.8%' },
                    { name: 'Database', status: 'operational', uptime: '99.99%' },
                    { name: 'Email Service', status: 'operational', uptime: '99.5%' },
                    { name: 'File Storage', status: 'operational', uptime: '99.7%' }
                ],
                incidents: [
                    {
                        title: 'Scheduled Maintenance',
                        description: 'Database upgrade scheduled for next week',
                        status: 'scheduled',
                        date: '2024-03-15'
                    }
                ],
                updated: new Date().toISOString()
            };

            return res.render('public/status', {
                title: 'System Status',
                status: systemStatus,
                description: 'Check the current status of our services'
            });

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Sitemap
    async sitemap(req, res) {
        try {
            const pages = [
                { url: '/', priority: 1.0, changefreq: 'daily' },
                { url: '/features', priority: 0.8, changefreq: 'monthly' },
                { url: '/pricing', priority: 0.8, changefreq: 'monthly' },
                { url: '/about', priority: 0.5, changefreq: 'monthly' },
                { url: '/contact', priority: 0.5, changefreq: 'monthly' },
                { url: '/faq', priority: 0.7, changefreq: 'monthly' },
                { url: '/privacy', priority: 0.3, changefreq: 'yearly' },
                { url: '/terms', priority: 0.3, changefreq: 'yearly' },
                { url: '/status', priority: 0.3, changefreq: 'weekly' }
            ];

            res.set('Content-Type', 'application/xml');
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

            pages.forEach(page => {
                xml += '  <url>\n';
                xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
                xml += `    <priority>${page.priority}</priority>\n`;
                xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
                xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
                xml += '  </url>\n';
            });

            xml += '</urlset>';

            return res.send(xml);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Robots.txt
    async robots(req, res) {
        try {
            res.set('Content-Type', 'text/plain');
            const robots = `# Allow all robots
User-agent: *
Allow: /

# Sitemap
Sitemap: ${process.env.BASE_URL || 'http://localhost:3000'}/sitemap.xml

# Disallow admin area
Disallow: /admin/
Disallow: /api/

# Disallow sensitive pages
Disallow: /auth/
Disallow: /dashboard/`;

            return res.send(robots);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Health check
    async health(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                database: 'connected',
                version: process.version,
                env: process.env.NODE_ENV || 'development'
            };

            return res.json(health);

        } catch (error) {
            return res.status(500).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }

    // Serve uploaded files with security
    async serveFile(req, res) {
        try {
            const { type, filename } = req.params;

            // Validate file type
            const allowedTypes = ['profiles', 'receipts', 'documents'];
            if (!allowedTypes.includes(type)) {
                return res.status(403).send('Access denied');
            }

            // Validate filename (prevent directory traversal)
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(403).send('Access denied');
            }

            // Check file extension
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
            const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));

            if (!allowedExtensions.includes(ext)) {
                return res.status(403).send('Access denied');
            }

            // In production, you would also check if the user has permission to access this file
            // For now, serve the file if it exists
            const path = require('path');
            const fs = require('fs');

            const filePath = path.join(__dirname, '../../public/uploads', type, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).send('File not found');
            }

            // Set appropriate headers
            res.setHeader('Content-Type', this.getMimeType(ext));
            res.setHeader('Content-Disposition', 'inline'); // Display in browser

            return res.sendFile(filePath);

        } catch (error) {
            console.error('File serving error:', error);
            return res.status(500).send('Internal server error');
        }
    }

    // Get MIME type from extension
    getMimeType(ext) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        return mimeTypes[ext] || 'application/octet-stream';
    }
}

module.exports = new PublicController();