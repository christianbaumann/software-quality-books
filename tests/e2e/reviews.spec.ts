import {expect, test} from '@playwright/test'
import {faker} from '@faker-js/faker'
import bcrypt from 'bcryptjs'

import prisma from '../../src/lib/db'

test.describe('Book Reviews', () => {
    test('should show review form when user is logged in', async ({page}) => {
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

        const testBook = await prisma.book.create({
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

        await page.context().clearCookies()

        const csrfResponse = await page.request.get('/api/auth/csrf')
        const {csrfToken} = await csrfResponse.json()

        const signInResponse = await page.request.post('/api/auth/callback/credentials', {
            form: {
                csrfToken,
                email: testUser.email,
                password: testUser.password,
                callbackUrl: '/'
            }
        })

        await page.request.get('/api/auth/session')
        await page.goto('/')

        await page.goto(`/books/${testBook.id}`)
        await expect(page.locator('form')).toBeVisible()
    })

    test('should not show review form when user is not logged in', async ({page}) => {
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

        const testBook = await prisma.book.create({
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

        await page.goto(`/books/${testBook.id}`)
        await expect(page.locator('form')).not.toBeVisible()
        await expect(page.getByText('Sign in to leave a review')).toBeVisible()
    })

    test('should show validation error when submitting empty review', async ({page}) => {
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

        const testBook = await prisma.book.create({
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

        await page.context().clearCookies()

        const csrfResponse = await page.request.get('/api/auth/csrf')
        const {csrfToken} = await csrfResponse.json()

        await page.request.post('/api/auth/callback/credentials', {
            form: {
                csrfToken,
                email: testUser.email,
                password: testUser.password,
                callbackUrl: '/'
            }
        })

        await page.request.get('/api/auth/session')
        await page.goto('/')

        await page.goto(`/books/${testBook.id}`)
        await page.getByLabel('Review').fill('')
        await page.getByRole('button', {name: /Submit Review|Submitting.../}).click()
        await expect(page.getByText('Review content is required')).toBeVisible()
        await expect(page.getByText('Rating is required')).toBeVisible()
    })

    test('should successfully submit review', async ({page}) => {
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

        const testBook = await prisma.book.create({
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

        await page.context().clearCookies()

        const csrfResponse = await page.request.get('/api/auth/csrf')
        const {csrfToken} = await csrfResponse.json()

        await page.request.post('/api/auth/callback/credentials', {
            form: {
                csrfToken,
                email: testUser.email,
                password: testUser.password,
                callbackUrl: '/'
            }
        })

        await page.request.get('/api/auth/session')
        await page.goto('/')

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
    })

    test('should hide review form after submitting a review', async ({page}) => {
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

        const testBook = await prisma.book.create({
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

        await page.context().clearCookies()

        const csrfResponse = await page.request.get('/api/auth/csrf')
        const {csrfToken} = await csrfResponse.json()

        await page.request.post('/api/auth/callback/credentials', {
            form: {
                csrfToken,
                email: testUser.email,
                password: testUser.password,
                callbackUrl: '/'
            }
        })

        await page.request.get('/api/auth/session')
        await page.goto('/')

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
    })

    test('should show already reviewed message when revisiting page', async ({page}) => {
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

        const testBook = await prisma.book.create({
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

        await page.context().clearCookies()

        const csrfResponse = await page.request.get('/api/auth/csrf')
        const {csrfToken} = await csrfResponse.json()

        await page.request.post('/api/auth/callback/credentials', {
            form: {
                csrfToken,
                email: testUser.email,
                password: testUser.password,
                callbackUrl: '/'
            }
        })

        await page.request.get('/api/auth/session')
        await page.goto('/')

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
    })
})
