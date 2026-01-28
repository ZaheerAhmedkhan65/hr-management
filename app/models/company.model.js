// app/models/company.model.js
const ApplicationModel = require('./application.model');

class CompanyModel extends ApplicationModel {
    // Find company by ID
    static findById(id) {
        return this.query('SELECT * FROM companies WHERE id = ?', [id]);
    }

    // Find company by email
    static findByEmail(email) {
        return this.query('SELECT * FROM companies WHERE company_email = ?', [email]);
    }

    // Find company by tax ID
    static findByTaxId(taxId) {
        return this.query('SELECT * FROM companies WHERE tax_id = ?', [taxId]);
    }

    // Create new company
    static create(companyData) {
        const {
            company_name, company_email, company_phone, address,
            industry, tax_id, registration_number
        } = companyData;

        return this.query(
            `INSERT INTO companies 
            (company_name, company_email, company_phone, address, industry, tax_id, registration_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                company_name, company_email, company_phone, address,
                industry, tax_id, registration_number
            ]
        );
    }

    // Update company
    static update(id, companyData) {
        const fields = [];
        const values = [];

        Object.keys(companyData).forEach(key => {
            if (companyData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(companyData[key]);
            }
        });

        values.push(id);

        return this.query(
            `UPDATE companies SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    }

    // Get all companies
    static findAll() {
        return this.query('SELECT * FROM companies ORDER BY company_name');
    }

    // Get active companies
    static findActive() {
        return this.query('SELECT * FROM companies WHERE status = "active" ORDER BY company_name');
    }

    // Update company status
    static updateStatus(id, status) {
        return this.query('UPDATE companies SET status = ? WHERE id = ?', [status, id]);
    }

    // Update subscription
    static updateSubscription(id, plan, expiry) {
        return this.query(
            'UPDATE companies SET subscription_plan = ?, subscription_expiry = ? WHERE id = ?',
            [plan, expiry, id]
        );
    }

    // Count total companies
    static countAll() {
        return this.query('SELECT COUNT(*) as total FROM companies');
    }

    // Get companies by subscription plan
    static findByPlan(plan) {
        return this.query('SELECT * FROM companies WHERE subscription_plan = ? ORDER BY company_name', [plan]);
    }
}

module.exports = CompanyModel;