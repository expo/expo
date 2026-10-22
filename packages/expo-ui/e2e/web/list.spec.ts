import { expect, type Page, test } from '@playwright/test';

// Data rows of the universal List screen render as `#<id>: <name>`. The static
// `#42: Slot form (compound children)` row has parentheses, so it does not match.
const DATA_ROW = /^#\d+: [A-Za-z ]+$/;
const ITEM_COUNT = 1008;

async function gotoList(page: Page) {
  await page.goto('/components/ui-universal/list', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('#1: Avocado toast', { exact: true })).toBeVisible({
    timeout: 60_000,
  });
}

// Returns the ids of the data rows in the viewport, from top to bottom.
async function visibleRowIds(page: Page): Promise<number[]> {
  const rows = await page.getByText(DATA_ROW).evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { text: node.textContent ?? '', top: rect.top, bottom: rect.bottom };
    })
  );
  const viewportHeight = page.viewportSize()!.height;
  return rows
    .filter((row) => row.bottom > 0 && row.top < viewportHeight)
    .sort((a, b) => a.top - b.top)
    .map((row) => Number(/^#(\d+):/.exec(row.text)![1]));
}

function expectConsecutive(ids: number[]) {
  expect(ids.length).toBeGreaterThan(3);
  ids.forEach((id, index) => expect(id).toBe(ids[0]! + index));
}

async function nextFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}

test('List.ForEach mounts only the rows near the visible range', async ({ page }) => {
  await gotoList(page);
  const mounted = await page.getByText(DATA_ROW).count();
  expect(mounted).toBeGreaterThan(8);
  expect(mounted).toBeLessThan(100);
});

test('List.ForEach shows every row in order while scrolling to the end', async ({ page }) => {
  await gotoList(page);
  await page.getByText('#1: Avocado toast', { exact: true }).hover();

  let ids: number[] = [];
  for (let step = 0; step < 200; step++) {
    await page.mouse.wheel(0, 1500);
    await nextFrames(page);
    ids = await visibleRowIds(page);
    expectConsecutive(ids);
    if (ids.at(-1) === ITEM_COUNT) break;
  }
  expect(ids.at(-1)).toBe(ITEM_COUNT);
  expect(await page.getByText(DATA_ROW).count()).toBeLessThan(100);

  // Scroll back to the top through rows that were measured on the way down.
  for (let step = 0; step < 200; step++) {
    await page.mouse.wheel(0, -1500);
    await nextFrames(page);
    ids = await visibleRowIds(page);
    if (ids.length > 0 && ids[0]! <= 1) break;
    expectConsecutive(ids);
  }
  await expect(page.getByText('#1: Avocado toast', { exact: true })).toBeVisible();
});
