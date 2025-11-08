import {expect, test} from '@playwright/test'
import {faker} from '@faker-js/faker'
import bcrypt from 'bcryptjs'

import prisma from '../../src/lib/db'

test.describe('Login Validation', () => {

    test('should show both validation messages when fields are empty', async ({page}) => {
        await page.goto('/login')
        await page.locator('button[type="submit"]').click()
        await expect(page.getByText('Invalid email address')).toBeVisible()
        await expect(page.getByText('Password is required')).toBeVisible()
    })

    test('should show only password validation when email is filled', async ({page}) => {
        await page.goto('/login')
        await page.locator('input[name="email"]').fill('test@example.com')
        await page.locator('button[type="submit"]').click()
        await expect(page.getByText('Password is required')).toBeVisible()
    })

    test('should show only email validation when password is filled', async ({page}) => {
        await page.goto('/login')
        await page.locator('input[name="password"]').fill('password123')
        await page.locator('button[type="submit"]').click()
        await expect(page.getByText('Invalid email address')).toBeVisible()
    })

    test('should successfully login with valid credentials', async ({page}) => {
        const userId = faker.string.uuid()
        const userEmail = faker.internet.email()
        const userPassword = faker.internet.password()
        const userName = faker.person.fullName()
        const hashedPassword = await bcrypt.hash(userPassword, 10)

        const user = await prisma.user.create({
            data: {
                id: userId,
                email: userEmail,
                password: hashedPassword,
                profile: {
                    create: {
                        name: userName,
                    }
                }
            },
            include: {
                profile: true
            }
        })

        const testUser = {
            ...user,
            password: userPassword
        }

        await page.goto('/login')
        await page.locator('input[name="email"]').fill(testUser.email)
        await page.locator('input[name="password"]').fill(testUser.password)
        await page.locator('button[type="submit"]').click()

        await expect(page).toHaveURL('/books')
    })
})
