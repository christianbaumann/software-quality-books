import {Page} from '@playwright/test'
import {faker} from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import prisma from '../../src/lib/db'

export class TestHelper {
    private readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    async createAndLoginUser(email?: string, password?: string, name?: string) {
        const userId = faker.string.uuid()
        const userEmail = email || faker.internet.email()
        const userPassword = password || faker.internet.password()
        const userName = name || faker.person.fullName()
        const hashedPassword = await bcrypt.hash(userPassword, 10)

        const user = await prisma.user.create({
            data: {
                id: userId,
                email: userEmail,
                password: hashedPassword,
                profile: {
                    create: {name: userName}
                }
            }
        })

        await this.page.context().clearCookies()
        const csrfResponse = await this.page.request.get('/api/auth/csrf')
        const {csrfToken} = await csrfResponse.json()

        await this.page.request.post('/api/auth/callback/credentials', {
            form: {csrfToken, email: userEmail, password: userPassword, callbackUrl: '/'}
        })

        await this.page.request.get('/api/auth/session')
        await this.page.goto('/')

        return {...user, password: userPassword}
    }

    async createBook(userId: string, title?: string, description?: string) {
        return await prisma.book.create({
            data: {
                id: faker.string.uuid(),
                title: title || faker.lorem.words(3),
                description: description || faker.lorem.paragraph(),
                userId: userId
            }
        })
    }

    async createReview(bookId: string, userId: string, rating?: number, content?: string) {
        return await prisma.review.create({
            data: {
                content: content || faker.lorem.paragraph(),
                rating: rating || 5,
                bookId,
                userId
            }
        })
    }

    async cleanupUser(email: string) {
        await prisma.user.delete({where: {email}})
    }

    async cleanupBook(id: string) {
        await prisma.book.delete({where: {id}})
    }
}
