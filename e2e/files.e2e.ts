import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('lists saved documents and opens them from the Arquivos panel', async ({ page }) => {
  await page.locator('.dock-item', { hasText: 'Papiro' }).click()
  await page.getByRole('textbox', { name: 'Notas' }).fill('Lista de oferendas\ntrigo')
  await page.locator('.window[aria-label="Papiro"]').getByRole('button', { name: 'Fechar' }).click()
  await expect(page.locator('.window')).toHaveCount(0)

  await page.getByRole('button', { name: 'Arquivos', exact: true }).click()
  const item = page.getByRole('button', { name: /Lista de oferendas/ })
  await expect(item).toContainText('Papiro · 4 palavras')
  await item.click()
  await expect(page.locator('.window[aria-label="Papiro"]')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Notas' })).toHaveValue('Lista de oferendas\ntrigo')

  // A second click focuses the open window instead of opening another one.
  await item.click()
  await expect(page.locator('.window[aria-label="Papiro"]')).toHaveCount(1)
})

test('shows an empty state before anything is saved', async ({ page }) => {
  await page.getByRole('button', { name: 'Arquivos', exact: true }).click()
  await expect(page.getByText('Nenhum documento salvo ainda.', { exact: false })).toBeVisible()
})
