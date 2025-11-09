import {test, expect} from '../fixtures/registration-fixture'
import {UserBuilder} from '../data-builders/user-builder'
import prisma from '../../src/lib/db'

test.describe('Registration', () => {
    test.afterEach(async () => {
        await prisma.$disconnect()
    })

    test('shows success notification when registering a new account', async ({
                                                                                 registrationHelper,
                                                                                 userBuilder
                                                                             }) => {
        const testUser = await userBuilder.build()
        await registrationHelper.registerNewUser(testUser)

        // Test still needs to know about success message - helper doesn't validate
        await expect(await registrationHelper.expectSuccessMessage()).toBeVisible()
        await expect(registrationHelper.page).toHaveURL('/login')
    })

    test('shows error when name is only 1 character', async ({
                                                                 registrationHelper,
                                                                 userBuilder
                                                             }) => {
        const testUser = await userBuilder
            .withName('A')
            .build()

        await registrationHelper.registerNewUser(testUser)

        await expect(registrationHelper.page.getByText('Name must be at least 2 characters')).toBeVisible()
        await expect(registrationHelper.page).toHaveURL('/register')
    })

    test('shows error when email format is invalid', async ({
                                                                registrationHelper,
                                                                userBuilder
                                                            }) => {
        const testUser = await userBuilder
            .withEmail('not-an-email')
            .build()

        await registrationHelper.registerNewUser(testUser)

        await expect(registrationHelper.page.getByText('Invalid email address')).toBeVisible()
        await expect(registrationHelper.page).toHaveURL('/register')
    })

    test('shows error when password is only 5 characters', async ({
                                                                      registrationHelper,
                                                                      userBuilder
                                                                  }) => {
        const testUser = await userBuilder
            .withPassword('12345')
            .build()

        await registrationHelper.registerNewUser(testUser)

        await expect(registrationHelper.page.getByText('Password must be at least 8 characters')).toBeVisible()
        await expect(registrationHelper.page).toHaveURL('/register')
    })

    test('shows both name and email errors when password is valid', async ({
                                                                               registrationHelper,
                                                                               userBuilder
                                                                           }) => {
        const testUser = await userBuilder
            .withName('A')
            .withEmail('not-an-email')
            .build()

        await registrationHelper.registerNewUser(testUser)

        await expect(registrationHelper.page.getByText('Name must be at least 2 characters')).toBeVisible()
        await expect(registrationHelper.page.getByText('Invalid email address')).toBeVisible()
        await expect(registrationHelper.page).toHaveURL('/register')
    })

    test('makes no API calls when validation fails', async ({
                                                                registrationHelper,
                                                                userBuilder,
                                                                page
                                                            }) => {
        let apiCallMade = false
        await page.route('**/api/auth/register', async route => {
            apiCallMade = true
            await route.fulfill({status: 200})
        })

        const testUser = await userBuilder
            .withName('A')
            .withEmail('not-an-email')
            .build()

        await registrationHelper.registerNewUser(testUser)

        await expect(registrationHelper.page.getByText('Name must be at least 2 characters')).toBeVisible()
        await expect(registrationHelper.page.getByText('Invalid email address')).toBeVisible()

        expect(apiCallMade).toBe(false)
    })

    test('has correct login link text and path', async ({registrationHelper}) => {
        await registrationHelper.page.goto('/register')

        const loginLink = registrationHelper.page.getByText('Already have an account? Sign in')

        await expect(loginLink).toBeVisible()
        await expect(loginLink).toHaveAttribute('href', '/login')
    })
})
