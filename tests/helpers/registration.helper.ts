import {Page} from '@playwright/test'

type TestUser = {
    id: string
    email: string
    password: string
    name: string
}

export class RegistrationHelper {
    private readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    async registerNewUser(testUser: TestUser) {
        await this.page.goto('/register')
        await this.page.getByLabel('Email').fill(testUser.email)
        await this.page.getByLabel('Password').fill(testUser.password)
        await this.page.getByLabel('Name').fill(testUser.name)
        await this.page.getByText('Create account').click()
    }
}
