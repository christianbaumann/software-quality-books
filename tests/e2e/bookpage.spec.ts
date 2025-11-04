import {expect, test} from '@playwright/test'
import {Book} from '@prisma/client'
import {faker} from '@faker-js/faker'
import bcrypt from 'bcryptjs'

import prisma from '../../src/lib/db'

test.describe('Book page data', () => {
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

        const bookId = faker.string.uuid()
        const bookTitle = faker.lorem.words(3)
        const bookDescription = faker.lorem.paragraph()

        testBook = await prisma.book.create({
            data: {
                id: bookId,
                title: bookTitle,
                description: bookDescription,
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

    test('should display book with correct title', async ({page}) => {
        await page.goto(`/books/${testBook.id}`)
        const bookTitle = await page.getByTestId('book-title').textContent()
        expect(bookTitle).toBe(testBook.title)
    })

    test('should display book with correct description', async ({page}) => {
        await page.goto(`/books/${testBook.id}`)
        const bookDescription = await page.getByTestId('book-description').textContent()
        expect(bookDescription).toBe(testBook.description)
    })
})
