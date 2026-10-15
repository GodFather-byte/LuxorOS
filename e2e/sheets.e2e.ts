import { expect, test, type Page } from '@playwright/test'

// exact: "Célula A1" must not also match A10–A19.
const cell = (page: Page, ref: string) => page.getByRole('textbox', { name: `Célula ${ref}`, exact: true })

async function type(page: Page, ref: string, raw: string) {
  await cell(page, ref).fill(raw)
  await page.keyboard.press('Enter')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.locator('.dock-item', { hasText: 'Tábuas' }).click()
})

test('calculates formulas and keeps the sheet after reload', async ({ page }) => {
  await type(page, 'A1', '2')
  await type(page, 'A2', '3,5')
  await type(page, 'A3', '=SOMA(A1:A2)')
  await expect(cell(page, 'A3')).toHaveValue('5,5')
  await expect(cell(page, 'A4')).toBeFocused()

  await cell(page, 'A3').focus()
  await expect(cell(page, 'A3')).toHaveValue('=SOMA(A1:A2)')

  await type(page, 'A1', '4')
  await expect(cell(page, 'A3')).toHaveValue('7,5')

  await page.reload()
  await expect(cell(page, 'A3')).toHaveValue('7,5')
})

test('flags circular references and cancels an edit with Escape', async ({ page }) => {
  await type(page, 'B1', '=B2')
  await type(page, 'B2', '=B1')
  await expect(cell(page, 'B1')).toHaveValue('#CICLO!')

  await cell(page, 'C1').fill('10')
  await page.keyboard.press('Escape')
  await expect(cell(page, 'C1')).toHaveValue('')
})
