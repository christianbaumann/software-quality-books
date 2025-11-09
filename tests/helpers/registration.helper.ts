import {Page} from '@playwright/test'

type TestUser = {
    email: string
    password: string
    name: string
}

export class RegistrationHelper {
    constructor(private page: Page) {
    }

    async registerNewUser(testUser: TestUser) {
        await this.page.goto('/register')

        await this.page.getByLabel('Email').fill(testUser.email)
        await this.page.getByLabel('Password').fill(testUser.password)
        await this.page.getByLabel('Name').fill(testUser.name)

        await this.page.getByText('Create account').click()
    }

    async expectSuccessMessage() {
        return this.page.getByText('Account created successfully!')
    }
}
