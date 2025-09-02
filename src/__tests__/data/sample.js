const config = {
    organisation: {
        name: 'Test org',
        email: 'john@zencomply.co',
        admin: {
            firstName: 'Esops',
            lastName: 'Admin',
            email: 'admin1@zencomply.co',
            password: 'password',
        },
        address: {
            address: 'Test address',
            city: 'Test city',
            zip: '12345',
            StateId: 1,
            taxId: '123456789',
        },
    },
    users: {
        harry: {
            firstName: 'Harry',
            lastName: 'Potter',
            email: 'harry@zencomply.co',
            password: 'password123+',
        },
        approver: {
            firstName: 'Approver',
            lastName: 'User',
            email: 'approver.user@example.com',
            password: 'password',
        },
    },
    plans: {
        defaultPlan: { name: 'API Plan', size: 500000, type: 'ESOP' },
    },
};
export default config;
