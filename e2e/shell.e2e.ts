import { expect, test, type Page } from '@playwright/test'

const windowByTitle = (page: Page, title: string) => page.locator(`.window[aria-label="${title}"]`)
const activeTemple = (page: Page) => page.locator('.temple-tab[aria-pressed="true"]')
const openFromDock = (page: Page, name: string) => page.locator('.dock-item', { hasText: name }).click()

/** Layout box relative to the desktop; unlike getBoundingClientRect it ignores the opening animation. */
const layoutBox = (page: Page, title: string) =>
  windowByTitle(page, title).evaluate((el: HTMLElement) => ({
    x: el.offsetLeft,
    y: el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight,
  }))

const zIndex = (page: Page, title: string) =>
  windowByTitle(page, title).evaluate((el: HTMLElement) => Number(el.style.zIndex))

async function drag(page: Page, selector: string, dx: number, dy: number) {
  const box = await page.locator(selector).boundingBox()
  if (!box) throw new Error(`${selector} is not visible`)
  const x = box.x + Math.min(30, box.width / 2)
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy, { steps: 10 })
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('loads the shell without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.reload()
  await expect(page.locator('.temple-tab:not(.new)')).toHaveText([/Karnak/, /Viagem/])
  expect(errors).toEqual([])
})

test('opens Papiro from the Dock and keeps the window and note after reload', async ({ page }) => {
  await openFromDock(page, 'Papiro')
  const notes = windowByTitle(page, 'Papiro').getByRole('textbox', { name: 'Notas' })
  await notes.fill('Lista de oferendas')
  await page.reload()
  await expect(windowByTitle(page, 'Papiro')).toBeVisible()
  await expect(notes).toHaveValue('Lista de oferendas')
})

test('drags and resizes a window, and restores its geometry after reload', async ({ page }) => {
  await openFromDock(page, 'Papiro')
  const start = await layoutBox(page, 'Papiro')

  await drag(page, '.window[aria-label="Papiro"] .window-titlebar', 120, 60)
  const moved = await layoutBox(page, 'Papiro')
  expect([moved.x - start.x, moved.y - start.y]).toEqual([120, 60])

  await drag(page, '.window[aria-label="Papiro"] .window-resize-handle', 80, 40)
  const resized = await layoutBox(page, 'Papiro')
  expect([resized.width - moved.width, resized.height - moved.height]).toEqual([80, 40])

  await page.reload()
  expect(await layoutBox(page, 'Papiro')).toEqual(resized)
})

test('resizes a window from the keyboard', async ({ page }) => {
  await openFromDock(page, 'Papiro')
  const before = await layoutBox(page, 'Papiro')
  await windowByTitle(page, 'Papiro').getByRole('button', { name: 'Redimensionar janela' }).focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowDown')
  const after = await layoutBox(page, 'Papiro')
  expect([after.width - before.width, after.height - before.height]).toEqual([16, 16])
})

test('keeps window controls working after a drag', async ({ page }) => {
  await openFromDock(page, 'Papiro')
  await drag(page, '.window[aria-label="Papiro"] .window-titlebar', 50, 30)
  await windowByTitle(page, 'Papiro').getByRole('button', { name: 'Minimizar' }).click()
  await expect(windowByTitle(page, 'Papiro')).toHaveCount(0)
  await page.locator('.dock-item.running').click()
  await expect(windowByTitle(page, 'Papiro')).toBeVisible()
  await windowByTitle(page, 'Papiro').getByRole('button', { name: 'Fechar' }).click()
  await expect(windowByTitle(page, 'Papiro')).toHaveCount(0)
})

test('switches Templos with Ctrl+Shift+arrows, but not while typing', async ({ page }) => {
  await expect(activeTemple(page)).toContainText('Karnak')
  await page.keyboard.press('Control+Shift+ArrowRight')
  await expect(activeTemple(page)).toContainText('Viagem')
  await page.keyboard.press('Control+Shift+ArrowRight')
  await expect(activeTemple(page)).toContainText('Karnak')

  await openFromDock(page, 'Papiro')
  await windowByTitle(page, 'Papiro').getByRole('textbox', { name: 'Notas' }).click()
  await page.keyboard.press('Control+Shift+ArrowRight')
  await expect(activeTemple(page)).toContainText('Karnak')
})

test('moves focus between windows with Ctrl+Shift+↓', async ({ page }) => {
  await openFromDock(page, 'Papiro')
  await openFromDock(page, 'Tábuas')
  expect(await zIndex(page, 'Tábuas')).toBeGreaterThan(await zIndex(page, 'Papiro'))
  await page.keyboard.press('Control+Shift+ArrowDown')
  expect(await zIndex(page, 'Papiro')).toBeGreaterThan(await zIndex(page, 'Tábuas'))
})

test('opens an app from the command palette with an accent-insensitive search', async ({ page }) => {
  await page.keyboard.press('Control+k')
  const search = page.getByRole('combobox', { name: 'Buscar comandos' })
  await expect(search).toBeFocused()
  await search.fill('tabuas')
  await search.press('Enter')
  await expect(windowByTitle(page, 'Tábuas')).toBeVisible()
  await expect(page.locator('dialog.command-palette')).toHaveCount(0)
})

test('keeps each Templo’s windows separate', async ({ page }) => {
  await openFromDock(page, 'Papiro')
  await page.getByRole('button', { name: /Viagem/ }).click()
  await expect(windowByTitle(page, 'Papiro')).toHaveCount(0)
  await page.getByRole('button', { name: /Karnak/ }).click()
  await expect(windowByTitle(page, 'Papiro')).toBeVisible()
})

test('falls back to the initial session when stored data is corrupt', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('luxoros:session:v1', '{not json'))
  await page.reload()
  await expect(page.locator('.temple-tab:not(.new)')).toHaveText([/Karnak/, /Viagem/])
  await expect(page.locator('.window')).toHaveCount(0)
})
