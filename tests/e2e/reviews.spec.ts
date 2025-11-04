import {expect, test} from '@playwright/test'
import {Book} from '@prisma/client'
import {faker} from '@faker-js/faker'
import bcrypt from 'bcryptjs'

import {AuthHelper} from '../helpers/auth.helper'
import prisma from '../../src/lib/db'

test.describe('Book Reviews', () => {
    test.describe.configure({mode: 'serial'})

    let testBook: Book & {
        user: {
            id: string
            email: string
            password: string
            createdAt: Date
            updatedAt: Date
        } | null
    }

    test.beforeAll(async () => {
        const ownerId = faker.string.uuid()
        const ownerEmail = faker.internet.email()
        const ownerPassword = faker.internet.password()
        const ownerName = faker.person.fullName()
        const hashedOwnerPassword = await bcrypt.hash(ownerPassword, 10)

        const owner = await prisma.user.create({
            data: {
                id: ownerId,
                email: ownerEmail,
                password: hashedOwnerPassword,
                profile: {
                    create: {
                        name: ownerName,
                    }
                }
            }
        })

        testBook = await prisma.book.create({
            data: {
                id: faker.string.uuid(),
                title: faker.lorem.words(3),
                description: faker.lorem.paragraph(),
                userId: owner.id
            },
            include: {
                user: true
            }
        })
    })

    test.afterAll(async () => {
        await prisma.book.delete({where: {id: testBook.id}})
        if (testBook.user?.email) {
            await prisma.user.delete({
                where: {email: testBook.user.email}
            })
        }
    })

    test('should show review form when user is logged in', async ({page}) => {
        const authHelper = new AuthHelper(page)
        await authHelper.loginUser()
        await page.goto(`/books/${testBook.id}`)
        await expect(page.locator('form')).toBeVisible()
    })

    test('should not show review form when user is not logged in', async ({page}) => {
        await page.goto(`/books/${testBook.id}`)
        await expect(page.locator('form')).not.toBeVisible()
        await expect(page.getByText('Sign in to leave a review')).toBeVisible()
    })

    test('should show validation error when submitting empty review', async ({page}) => {
        const authHelper = new AuthHelper(page)
        await authHelper.loginUser()
        await page.goto(`/books/${testBook.id}`)
        await page.getByLabel('Review').fill('')
        await page.getByRole('button', {name: /Submit Review|Submitting.../}).click()
        await expect(page.getByText('Review content is required')).toBeVisible()
        await expect(page.getByText('Rating is required')).toBeVisible()
    })

    test('should successfully submit review', async ({page}) => {
        const authHelper = new AuthHelper(page)
        const testUser = await authHelper.loginUser()
        await page.goto(`/books/${testBook.id}`)

        const reviewContent = 'This is a test review'
        const rating = 4

        await page.getByLabel('Review').fill(reviewContent)
        await page.getByLabel('Rating').selectOption(rating.toString())

        const [reviewResponse] = await Promise.all([
            page.waitForResponse(res =>
                res.url().includes('/api/books/') &&
                res.url().includes('/reviews') &&
                res.request().method() === 'POST'
            ),
            page.getByRole('button', {name: /Submit Review|Submitting.../}).click()
        ])

        if (!reviewResponse.ok()) {
            throw new Error(`Review submission failed with status ${reviewResponse.status()}`)
        }

        await prisma.user.delete({
            where: {email: testUser.email}
        })
    })

    test('should hide review form after submitting a review', async ({page}) => {
        const authHelper = new AuthHelper(page)
        const testUser = await authHelper.loginUser()
        await page.goto(`/books/${testBook.id}`)

        await page.getByLabel('Review').fill('Test review content')
        await page.getByLabel('Rating').selectOption('4')

        const [reviewResponse] = await Promise.all([
            page.waitForResponse(res =>
                res.url().includes('/api/books/') &&
                res.url().includes('/reviews') &&
                res.request().method() === 'POST'
            ),
            page.getByRole('button', {name: /Submit Review|Submitting.../}).click()
        ])

        if (!reviewResponse.ok()) {
            throw new Error(`Review submission failed with status ${reviewResponse.status()}`)
        }

        await page.waitForLoadState('networkidle')

        await expect(page.locator('form')).not.toBeVisible()
        await expect(page.getByText('You have already reviewed this book')).toBeVisible()

        await prisma.user.delete({
            where: {email: testUser.email}
        })
    })

    test('should show already reviewed message when revisiting page', async ({page}) => {
        const authHelper = new AuthHelper(page)
        const testUser = await authHelper.loginUser()
        await page.goto(`/books/${testBook.id}`)

        await page.getByLabel('Review').fill('Test review content')
        await page.getByLabel('Rating').selectOption('4')

        const [reviewResponse] = await Promise.all([
            page.waitForResponse(res =>
                res.url().includes('/api/books/') &&
                res.url().includes('/reviews') &&
                res.request().method() === 'POST'
            ),
            page.getByRole('button', {name: /Submit Review|Submitting.../}).click()
        ])

        if (!reviewResponse.ok()) {
            throw new Error(`Review submission failed with status ${reviewResponse.status()}`)
        }

        await page.waitForLoadState('networkidle')

        await page.reload({waitUntil: 'networkidle'})

        await expect(page.locator('form')).not.toBeVisible()
        await expect(page.getByText('You have already reviewed this book')).toBeVisible()

        await prisma.user.delete({
            where: {email: testUser.email}
        })
    })
})
