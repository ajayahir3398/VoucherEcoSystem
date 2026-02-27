const { Client } = require('pg');

const client = new Client({
    host: 'dpg-d6enk67gi27c73fg298g-a.singapore-postgres.render.com',
    port: 5432,
    user: 'voucherecosystem',
    password: 'nEJcdWJvPHHMVQAL6ePHrHWyOhRAaIoO',
    database: 'voucherecosystem',
    ssl: {
        rejectUnauthorized: false,
    },
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database natively!');

        await client.query('TRUNCATE TABLE "employee_coupons" CASCADE;');
        console.log('Successfully truncated orphaned employee_coupons.');

    } catch (error) {
        console.error('Error during database operation:', error.message);
    } finally {
        await client.end();
    }
}

run();
