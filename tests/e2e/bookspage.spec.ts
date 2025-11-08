import {expect, test} from '@playwright/test'
import {TEST_BOOK, initializeTestData} from '../fixtures/setup'
import {generateTestId, TEST_DATA_IDS} from '../../src/utils/idHelpers'

test.describe('Books Page', () => {
    test.beforeAll(async () => {
        await initializeTestData()
    })

    test('should display created book', async ({page}) => {
        await page.goto('/books')
        await expect(page.getByTestId(generateTestId(TEST_DATA_IDS.BOOK_CARD, TEST_BOOK.title))).toBeVisible()
    })

    test('should display book with correct title', async ({page}) => {
        await page.goto('/books')
        const bookCard = page.getByTestId(generateTestId(TEST_DATA_IDS.BOOK_CARD, TEST_BOOK.title))
        const titleElement = bookCard.locator('h2')
        const bookTitle = await titleElement.textContent()
        expect(bookTitle).toBe(TEST_BOOK.title)
    })

    test('should display book with correct created date', async ({page}) => {
        await page.goto('/books')
        const bookCard = page.getByTestId(generateTestId(TEST_DATA_IDS.BOOK_CARD, TEST_BOOK.title))
        const dateElement = bookCard.getByTestId('date-created')
        const bookCreatedDate = await dateElement.textContent()
        expect(bookCreatedDate).toBeTruthy()
    })
})
