import {expect, test} from '@playwright/test'
import {Book} from '@prisma/client'
import {faker} from '@faker-js/faker'
import bcrypt from 'bcryptjs'

import prisma from '../../src/lib/db'
import {generateTestId, TEST_DATA_IDS} from '../../src/utils/idHelpers'

test.describe('Books Page', () => {
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
            }
        })

        testBook = await prisma.book.create({
            data: {
                id: faker.string.uuid(),
                title: faker.lorem.words(3),
                description: faker.lorem.paragraph(),
                userId: user.id
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

    test('should display created book', async ({page}) => {
        await page.goto('/books')
        await expect(page.getByTestId(generateTestId(TEST_DATA_IDS.BOOK_CARD, testBook.title))).toBeVisible()
    })

    test('should display book with correct title', async ({page}) => {
        await page.goto('/books')
        const bookCard = page.getByTestId(generateTestId(TEST_DATA_IDS.BOOK_CARD, testBook.title))
        const titleElement = bookCard.locator('h2')
        const bookTitle = await titleElement.textContent()
        expect(bookTitle).toBe(testBook.title)
    })

    test('should display book with correct created date', async ({page}) => {
        await page.goto('/books')
        const bookCard = page.getByTestId(generateTestId(TEST_DATA_IDS.BOOK_CARD, testBook.title))
        const dateElement = bookCard.getByTestId('date-created')
        const bookCreatedDate = await dateElement.textContent()
        const expectedDate = new Intl.DateTimeFormat('en-US').format(testBook.createdAt)
        expect(bookCreatedDate).toBe(expectedDate)
    })
})
