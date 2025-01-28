import { test, expect } from '@playwright/test';
import { Client } from 'pg';

let pgClient: Client;

test.beforeAll(async () => {
    // Connect to PostgreSQL
    pgClient = new Client({
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        user: 'test',
        password: 'test'
    });
    await pgClient.connect();
});

test.afterEach(async () => {
    // Clear database between tests
    await pgClient.query('DELETE FROM "user"');
});

test.afterAll(async () => {
    await pgClient.end();
});

test('should successfully register a user with unique email', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByTestId('email-input').fill('unique@example.com');
    await page.getByTestId('username-input').fill('user3');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toBeVisible();
});

test('should handle multiple successful registrations', async ({ page }) => {
    const users = [
        { email: 'user1@example.com', username: 'user1' },
        { email: 'user2@example.com', username: 'user2' },
        { email: 'user3@example.com', username: 'user3' }
    ];

    for (const user of users) {
        await page.goto('http://localhost:5173');
        await page.getByTestId('email-input').fill(user.email);
        await page.getByTestId('username-input').fill(user.username);
        await page.getByTestId('submit-button').click();

        await expect(page.getByTestId('success-message')).toBeVisible();
    }
});

test('should preserve username case sensitivity', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByTestId('email-input').fill('case@example.com');
    await page.getByTestId('username-input').fill('TestUser');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toBeVisible();

    // Verify in database
    const result = await pgClient.query(
        'SELECT username FROM "user" WHERE email = $1',
        ['case@example.com']
    );
    expect(result.rows[0].username).toBe('TestUser');
});

// Add new test for UTF-8 username handling
test('should handle registration with accented characters in username', async ({ page }) => {
    const user = { 
        username: "Sophie Müller", 
        email: "sophie@example.com" 
    };

    await page.goto('http://localhost:5173');
    await page.getByTestId('email-input').fill(user.email);
    await page.getByTestId('username-input').fill(user.username);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toBeVisible();

    // Verify what was stored in database
    const result = await pgClient.query(
        'SELECT username FROM "user" WHERE email = $1',
        [user.email]
    );

    // This should fail with LATIN1 encoding, showing the encoding bug
    expect(result.rows[0].username).toBe(user.username);
});

test('should prevent registration with same email in different case', async ({ page }) => {
    // First registration
    await page.goto('http://localhost:5173');
    await page.getByTestId('email-input').fill('user@example.com');
    await page.getByTestId('username-input').fill('user1');
    await page.getByTestId('submit-button').click();
    await expect(page.getByTestId('success-message')).toBeVisible();

    // Try registering with same email in different case
    await page.getByTestId('email-input').fill('USER@EXAMPLE.COM');
    await page.getByTestId('username-input').fill('user2');
    await page.getByTestId('submit-button').click();

    // Should show error message instead of success
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toHaveText('Email already registered');

    // Verify in database that we have only one user
    const result = await pgClient.query(
        'SELECT COUNT(*) as count FROM "user" WHERE LOWER(email) = LOWER($1)',
        ['user@example.com']
    );
    expect(parseInt(result.rows[0].count)).toBe(1); // Should pass now
});