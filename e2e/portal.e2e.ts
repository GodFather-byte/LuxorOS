import { expect, test, type Page } from '@playwright/test'

const address = (page: Page) => page.getByRole('textbox', { name: 'Endereço' })
const frame = (page: Page) => page.frameLocator('.portal-app iframe')

async function visit(page: Page, text: string) {
  await address(page).fill(text)
  await address(page).press('Enter')
}

test.beforeEach(async ({ page }) => {
  // Serve framed pages locally so the tests never depend on the network (UTF-8: the body has accents).
  await page.route('https://portal.test/**', (route) => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<h1>Página ${path}</h1>` })
  })
  await page.goto('/')
  await page.locator('.dock-item', { hasText: 'Portal' }).click()
})

test('opens a page in a sandboxed frame without same-origin access', async ({ page }) => {
  await visit(page, 'portal.test/ola')
  await expect(frame(page).getByRole('heading', { name: 'Página /ola' })).toBeVisible()
  await expect(address(page)).toHaveValue('https://portal.test/ola')
  const sandbox = await page.locator('.portal-app iframe').getAttribute('sandbox')
  expect(sandbox).toContain('allow-scripts')
  expect(sandbox).not.toContain('allow-same-origin')
  await expect(page.getByRole('link', { name: 'Abrir em nova aba' })).toHaveAttribute('href', 'https://portal.test/ola')
})

test('goes back and forward, and reopens the last page after reload', async ({ page }) => {
  await visit(page, 'https://portal.test/um')
  await visit(page, 'https://portal.test/dois')
  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(frame(page).getByRole('heading', { name: 'Página /um' })).toBeVisible()
  await expect(address(page)).toHaveValue('https://portal.test/um')
  await page.getByRole('button', { name: 'Avançar' }).click()
  await expect(frame(page).getByRole('heading', { name: 'Página /dois' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Avançar' })).toBeDisabled()

  await page.reload()
  await expect(frame(page).getByRole('heading', { name: 'Página /dois' })).toBeVisible()
})

test('refuses javascript: addresses and sends searches to a new tab', async ({ page }) => {
  await visit(page, 'javascript:alert(1)')
  await expect(page.getByRole('alert')).toHaveText('O Portal só abre endereços http e https.')
  await expect(page.locator('.portal-app iframe')).toHaveCount(0)

  await visit(page, 'templo de karnak')
  await expect(page.getByRole('link', { name: 'Pesquisar “templo de karnak”' }))
    .toHaveAttribute('href', 'https://duckduckgo.com/?q=templo%20de%20karnak')
  await expect(page.locator('.portal-app iframe')).toHaveCount(0)
})
