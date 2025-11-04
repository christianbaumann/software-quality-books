import {faker} from '@faker-js/faker'
import bcrypt from 'bcryptjs'

import prisma from '../../src/lib/db'

// Define required fields that must be present for every user
export type TestUser = {
    id: string
    email: string
    password: string
    name: string
}

export class UserBuilder {
    protected data: TestUser

    constructor() {
        this.data = {
            id: faker.string.uuid(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            name: faker.person.fullName()
        }
    }

    static aUser(): UserBuilder {
        return new UserBuilder()
    }

    // Inline base builder method
    with<K extends keyof TestUser>(key: K, value: TestUser[K]): this {
        this.data[key] = value
        return this
    }

    // Inline base builder method
    build(): TestUser {
        return this.data
    }

    withEmail(email: string): this {
        return this.with('email', email)
    }

    withPassword(password: string): this {
        return this.with('password', password)
    }

    withName(name: string): this {
        this.data.name = name
        return this
    }

    // Factory method to create in database
    async create() {
        const hashedPassword = await bcrypt.hash(this.data.password, 10)
        const rawPassword = this.data.password  // Store the raw password

        const user = await prisma.user.create({
            data: {
                id: this.data.id,
                email: this.data.email,
                password: hashedPassword,
                profile: {
                    create: {
                        name: this.data.name,
                    }
                }
            },
            include: {
                profile: true
            }
        })

        return {
            ...user,
            password: rawPassword  // Return the raw password instead of the hashed one
        }
    }

    // Factory method to delete from database
    static async delete(email: string) {
        await prisma.user.delete({
            where: {email}
        })
    }
}
