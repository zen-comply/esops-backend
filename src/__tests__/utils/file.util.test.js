import { expect } from 'chai';
import {
    fillHtmlTemplate,
    fillHtmlTemplateFromFile,
} from '../../utils/file.utils.js';

describe('Tests for file.util.js', () => {
    it('Should be able to generate html from a template', async () => {
        const template = `Hello!, my name is {{test}}`;
        const html = fillHtmlTemplate(template, { test: 'John Doe' });
        expect(html).to.equal('Hello!, my name is John Doe');
    });

    it.skip('Should be able to generate html from a template stored on s3', async () => {
        const html = await fillHtmlTemplateFromFile(
            global.defaultOrg.invoiceTemplate.file,
            {
                number: 'INV-001',
                date: '2025-02-19',
                ContractPlan: {
                    Contract: {
                        Seller: {
                            legalName: 'ABC Pvt Ltd',
                            Addresses: [
                                {
                                    address: '123 Business Street',
                                    city: 'Lucknow',
                                    State: { name: 'Uttar Pradesh' },
                                    zip: '226001',
                                },
                            ],
                        },
                        Purchaser: {
                            legalName: 'XYZ Enterprises',
                            Addresses: [
                                {
                                    address: '456 Market Road',
                                    city: 'Kanpur',
                                    State: { name: 'Uttar Pradesh' },
                                    zip: '208001',
                                },
                            ],
                        },
                        InvoiceTemplate: {
                            config: { dueDate: 7 },
                        },
                    },
                },
                InvoiceItems: [
                    {
                        PlanItem: {
                            Sku: { name: 'Product A' },
                            Currency: { symbol: '₹' },
                            config: { pricing: { price: 500.0 } },
                        },
                        description: 'Service Subscription',
                        quantity: 2,
                        total: 1000.0,
                    },
                    {
                        PlanItem: {
                            Sku: { name: 'Product B' },
                            Currency: { symbol: '₹' },
                            config: { pricing: { price: 750.0 } },
                        },
                        description: 'Annual Maintenance',
                        quantity: 1,
                        total: 750.0,
                    },
                ],
            }
        );
        expect(html).to.contain('INV-001');
    });
});
