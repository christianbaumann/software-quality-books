import {faker} from '@faker-js/faker'
import {Book} from '@prisma/client'

import prisma from '../../src/lib/db'

import {UserBuilder} from './user-builder'

// Define required fields that must be present for every book
type RequiredBookFields = {
    id: string
    title: string
    description: string
    userId: string
}

export class BookBuilder {
    protected data: RequiredBookFields
    private userBuilder?: UserBuilder

    constructor() {
        this.data = {
            id: faker.string.uuid(),
            title: faker.lorem.words(3),
            description: faker.lorem.paragraph(),
            userId: faker.string.uuid(), // This will be replaced when creating
        }
    }

    // Static factory method - this should stay static
    static aBook(): BookBuilder {
        return new BookBuilder()
    }

    // Inline base builder method
    with<K extends keyof RequiredBookFields>(key: K, value: RequiredBookFields[K]): this {
        this.data[key] = value
        return this
    }

    // Inline base builder method
    build(): Book {
        return this.data as Book
    }

    // Instance methods for building - these should NOT be static
    withTitle(title: string): this {
        return this.with('title', title)
    }

    withDescription(description: string): this {
        return this.with('description', description)
    }

    withUser(userBuilder: UserBuilder): this {
        this.userBuilder = userBuilder
        return this
    }

    // Create method - should NOT be static as it uses instance data
    async create() {
        // If no user was explicitly set, create one
        if (!this.userBuilder) {
            this.userBuilder = UserBuilder.aUser()
        }

        // Create user first (if needed) and get their ID
        const user = await this.userBuilder.create()
        this.data.userId = user.id

        // Now create the book
        return await prisma.book.create({
            data: this.data,
            include: {
                user: true
            }
        })
    }

    // Utility methods for deletion can be static
    static async delete(id: string) {
        await prisma.book.delete({
            where: {id}
        })
    }

    // Static method for bulk deletion
    static async deleteAll() {
        await prisma.book.deleteMany()
    }

    // Add this method to your existing BookBuilder class
    static async findByTitle(title: string) {
        return await prisma.book.findMany({
            where: {title}
        })
    }
}
