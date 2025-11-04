import {test, expect} from '@playwright/test'
import {faker} from '@faker-js/faker'
import prisma from '../../src/lib/db'

test.describe('Registration', () => {
    test('shows success notification when registering a new account', async ({page}) => {
        const testUser = {
            id: faker.string.uuid(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            name: faker.person.fullName()
        }

        await page.goto('/register')
        await page.getByLabel('Email').fill(testUser.email)
        await page.getByLabel('Password').fill(testUser.password)
        await page.getByLabel('Name').fill(testUser.name)
        await page.getByText('Create account').click()

        await expect(page.getByText('Account created successfully!')).toBeVisible()
        await expect(page).toHaveURL('/login')

        await test.step('cleanup', async () => {
            await prisma.user.delete({
                where: {email: testUser.email}
            })
        })
    })

    test('shows error when name is only 1 character', async ({page}) => {
        const testUser = {
            id: faker.string.uuid(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            name: 'A'
        }

        await page.goto('/register')
        await page.getByLabel('Email').fill(testUser.email)
        await page.getByLabel('Password').fill(testUser.password)
        await page.getByLabel('Name').fill(testUser.name)
        await page.getByText('Create account').click()

        await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
        await expect(page).toHaveURL('/register')
    })

    test('shows error when email format is invalid', async ({page}) => {
        const testUser = {
            id: faker.string.uuid(),
            email: 'not-an-email',
            password: faker.internet.password(),
            name: faker.person.fullName()
        }

        await page.goto('/register')
        await page.getByLabel('Email').fill(testUser.email)
        await page.getByLabel('Password').fill(testUser.password)
        await page.getByLabel('Name').fill(testUser.name)
        await page.getByText('Create account').click()

        await expect(page.getByText('Invalid email address')).toBeVisible()
        await expect(page).toHaveURL('/register')
    })

    test('shows error when password is only 5 characters', async ({page}) => {
        const testUser = {
            id: faker.string.uuid(),
            email: faker.internet.email(),
            password: '12345',
            name: faker.person.fullName()
        }

        await page.goto('/register')
        await page.getByLabel('Email').fill(testUser.email)
        await page.getByLabel('Password').fill(testUser.password)
        await page.getByLabel('Name').fill(testUser.name)
        await page.getByText('Create account').click()

        await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
        await expect(page).toHaveURL('/register')
    })

    test('shows both name and email errors when password is valid', async ({page}) => {
        const testUser = {
            id: faker.string.uuid(),
            email: 'not-an-email',
            password: faker.internet.password(),
            name: 'A'
        }

        await page.goto('/register')
        await page.getByLabel('Email').fill(testUser.email)
        await page.getByLabel('Password').fill(testUser.password)
        await page.getByLabel('Name').fill(testUser.name)
        await page.getByText('Create account').click()

        await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
        await expect(page.getByText('Invalid email address')).toBeVisible()
        await expect(page).toHaveURL('/register')
    })

    test('makes no API calls when validation fails', async ({page}) => {
        let apiCallMade = false;
        await page.route('**/api/auth/register', async route => {
            apiCallMade = true;
            await route.fulfill({status: 200});
        });

        const testUser = {
            id: faker.string.uuid(),
            email: 'not-an-email',
            password: faker.internet.password(),
            name: 'A'
        }

        await page.goto('/register')
        await page.getByLabel('Email').fill(testUser.email)
        await page.getByLabel('Password').fill(testUser.password)
        await page.getByLabel('Name').fill(testUser.name)
        await page.getByText('Create account').click()

        await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
        await expect(page.getByText('Invalid email address')).toBeVisible()

        expect(apiCallMade).toBe(false)
    })

    test('has correct login link text and path', async ({page}) => {
        await page.goto('/register')

        const loginLink = page.getByText('Already have an account? Sign in')

        await expect(loginLink).toBeVisible()
        await expect(loginLink).toHaveAttribute('href', '/login')
    })
})
