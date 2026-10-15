import { expect, test, type Page } from '@playwright/test'

const editor = (page: Page) => page.getByRole('textbox', { name: 'Documento em Markdown' })
const preview = (page: Page) => page.getByRole('article', { name: 'Pré-visualização' })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.locator('.dock-item', { hasText: 'Escriba' }).click()
})

test('renders Markdown in the preview and keeps the document after reload', async ({ page }) => {
  await editor(page).fill('# Diário\n\nHoje é **dia** de [festa](https://example.com).\n\n- item')
  await expect(preview(page).getByRole('heading', { level: 1, name: 'Diário' })).toBeVisible()
  await expect(preview(page).locator('strong')).toHaveText('dia')
  await expect(preview(page).getByRole('link', { name: 'festa' })).toHaveAttribute('href', 'https://example.com')
  await expect(preview(page).getByRole('listitem')).toHaveText(['item'])
  await expect(page.getByText('7 palavras')).toBeVisible()

  await page.reload()
  await expect(editor(page)).toHaveValue(/^# Diário/)
  await expect(preview(page).getByRole('heading', { level: 1, name: 'Diário' })).toBeVisible()
})

test('never turns raw HTML or javascript: links into live content', async ({ page }) => {
  // No underscores in the payload: they would parse as emphasis and hide the link from safeHref.
  await editor(page).fill('<img src=x onerror="window.pwned=1"> [x](javascript:window.pwned=1)')
  await expect(preview(page)).toContainText('<img src=x onerror=')
  await expect(preview(page).locator('img')).toHaveCount(0)
  await expect(preview(page).getByRole('link')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { pwned?: number }).pwned)).toBeUndefined()
})

test('switches between edit, split, and preview modes', async ({ page }) => {
  await page.getByRole('button', { name: 'Visualizar', exact: true }).click()
  await expect(editor(page)).toHaveCount(0)
  await expect(preview(page)).toBeVisible()
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await expect(preview(page)).toHaveCount(0)
  await expect(editor(page)).toBeVisible()
  await page.getByRole('button', { name: 'Dividir', exact: true }).click()
  await expect(editor(page)).toBeVisible()
  await expect(preview(page)).toBeVisible()
})
