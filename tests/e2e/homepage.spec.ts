import {expect, test} from '@playwright/test'

import {TestHelper} from '../helpers/test-helper'

test.describe('Homepage', () => {
    test('should show add book button when user is logged in', async ({page}) => {
        const helper = new TestHelper(page)
        await helper.createAndLoginUser()

        await page.goto('/')

        const addBookButton = page.getByRole('link', {name: 'Add New Book'})
        await expect(addBookButton).toBeVisible()
    })

    test('should navigate to login page when clicking Sign In button', async ({page}) => {
        await page.goto('/')

        const signInButton = page.getByText('Sign In')
        await signInButton.waitFor({state: 'visible'})
        await signInButton.click()

        await expect(page).toHaveURL('/login')
        await expect(page.getByRole('heading', {name: 'Sign in to your account'})).toBeVisible()
        await expect(page.getByLabel('Email')).toBeVisible()
        await expect(page.getByLabel('Password')).toBeVisible()
        await expect(page.getByRole('button', {name: 'Sign In'})).toBeVisible()
    })
})
