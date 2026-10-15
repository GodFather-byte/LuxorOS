import { expect, test, type Page } from '@playwright/test'

const activeTemple = (page: Page) => page.locator('.temple-tab[aria-pressed="true"]')
const lastReply = (page: Page) => page.locator('.msg.assistant').last()

async function ask(page: Page, text: string) {
  const input = page.getByRole('textbox', { name: 'Mensagem para o Copiloto' })
  await input.fill(text)
  await input.press('Enter')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Copiloto', exact: true }).click()
})

test('runs Portuguese commands: open an app, create and switch Templos', async ({ page }) => {
  await ask(page, 'abra as tábuas')
  await expect(lastReply(page)).toHaveText('Abrindo Tábuas.')
  await expect(page.locator('.window[aria-label="Tábuas"]')).toBeVisible()

  await ask(page, 'crie um templo chamado Oásis')
  await expect(lastReply(page)).toHaveText('Templo “Oásis” criado.')
  await expect(activeTemple(page)).toContainText('Oásis')
  await expect(page.locator('.window[aria-label="Tábuas"]')).toHaveCount(0)

  await ask(page, 'vá para Karnak')
  await expect(activeTemple(page)).toContainText('Karnak')
  await expect(page.locator('.window[aria-label="Tábuas"]')).toBeVisible()

  await ask(page, 'feche todas as janelas')
  await expect(page.locator('.window')).toHaveCount(0)
})

test('explains what it cannot do offline', async ({ page }) => {
  await ask(page, 'qual a capital do Egito?')
  await expect(lastReply(page)).toContainText('digite "ajuda"')
  await ask(page, 'ajuda')
  await expect(lastReply(page)).toContainText('Posso abrir aplicativos')
})
