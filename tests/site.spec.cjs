const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('首頁分清模型估計與實際紀錄', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('勒克萊爾比較容易');
  await expect(page.locator('#hero-intro')).toContainText('每 100 場約拿 10 次第四名');
  await expect(page.locator('#hero-p4')).toHaveText('35');
  await expect(page.locator('#hero-starts')).toHaveText('187');
  await expect(page.locator('#estimate-leclerc-value')).toHaveText('約 10 次');
  await expect(page.locator('#estimate-average-value')).toHaveText('約 3 次');
  await expect(page.locator('.estimate-axis')).toContainText('12 次');
});

test('最窄手機不產生整頁橫向捲動，主要點按區可操作', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await expect(page.locator('#season-chart .heat-cell')).toHaveCount(108);
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  const navHeight = await page.getByRole('link', { name: '結果', exact: true }).evaluate(element => element.getBoundingClientRect().height);
  const helpSize = await page.getByRole('button', { name: '說明模型估計' }).evaluate(element => element.getBoundingClientRect());
  expect(navHeight).toBeGreaterThanOrEqual(44);
  expect(helpSize.width).toBeGreaterThanOrEqual(44);
  expect(helpSize.height).toBeGreaterThanOrEqual(44);
});

test('賽季圖只佔一個 Tab，方向鍵與返回鍵保留選擇', async ({ page }) => {
  await page.goto('/');
  const current = page.locator('#season-chart .heat-cell[tabindex="0"]');
  await expect(current).toHaveCount(1);
  await current.press('ArrowRight');
  await expect(page.locator('#season-chart .heat-cell[tabindex="0"]')).toHaveAttribute('data-year', '2019');
  await page.locator('#season-chart .heat-cell[tabindex="0"]').press('ArrowDown');
  await page.locator('#season-chart .heat-cell[tabindex="0"]').press('Enter');
  await expect(page.locator('#race-driver')).toHaveValue('hamilton');
  await expect(page).toHaveURL(/driver=hamilton/);
  await page.goBack();
  await expect(page.locator('#race-driver')).toHaveValue('leclerc');
});

test('分享連結還原篩選，同一車手比較不保留舊圖說', async ({ page }) => {
  await page.goto('/?driver=hamilton&year=2024&duelA=leclerc&duelB=leclerc&view=p4#duel');
  await expect(page.locator('#race-driver')).toHaveValue('hamilton');
  await expect(page.locator('#race-year')).toHaveValue('2024');
  await expect(page.locator('input[name="race-view"][value="p4"]')).toBeChecked();
  await expect(page.locator('#duel-summary')).toHaveText('選了同一位車手；換一位再比較。');
  await expect(page.locator('#duel-chart')).toHaveAttribute('aria-label', '選了同一位車手；換一位再比較。');
  await page.locator('#duel-b').selectOption('hamilton');
  await expect(page.locator('#duel-chart')).toHaveAttribute('aria-label', /Lewis Hamilton/);
  await page.reload();
  await expect(page.locator('#duel-b')).toHaveValue('hamilton');
});

test('主要頁面沒有自動偵測到的嚴重無障礙問題', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#season-chart .heat-cell')).toHaveCount(108);
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(report.violations.filter(issue => ['critical', 'serious'].includes(issue.impact))).toEqual([]);
});

test('註解可用鍵盤關閉，賽道紀錄能打開對應逐場比賽', async ({ page }) => {
  await page.goto('/');
  const help = page.getByRole('button', { name: '說明模型估計' });
  await help.click();
  await expect(page.locator('#help-popover')).toBeVisible();
  await help.press('Escape');
  await expect(page.locator('#help-popover')).toBeHidden();
  await page.locator('#circuit-list .circuit-line').filter({ hasText: '2024' }).click();
  await expect(page).toHaveURL(/year=2024.*round=13#races/);
  await expect(page.locator('#race-detail')).toContainText('Hungarian Grand Prix');
});
