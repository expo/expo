import { expect, type Page, test } from '@playwright/test';

// Matches `#<id>: <name>` data rows, not the static `#42: Slot form (compound children)` row.
const DATA_ROW = /^#\d+: [A-Za-z ]+$/;
const ITEM_COUNT = 1008;

async function gotoList(page: Page) {
  await page.goto('/components/ui-universal/list', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('#1: Avocado toast', { exact: true })).toBeVisible({
    timeout: 60_000,
  });
}

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

  for (let step = 0; step < 200; step++) {
    await page.mouse.wheel(0, -1500);
    await nextFrames(page);
    ids = await visibleRowIds(page);
    if (ids.length > 0 && ids[0]! <= 1) break;
    expectConsecutive(ids);
  }
  await expect(page.getByText('#1: Avocado toast', { exact: true })).toBeVisible();
});

test('List.ForEach keeps rows in place when rows above it are measured', async ({ page }) => {
  await gotoList(page);
  const scroller = await page
    .getByText('#1: Avocado toast', { exact: true })
    .evaluateHandle((node) => {
      let element: HTMLElement | null = node as HTMLElement;
      while (element && getComputedStyle(element).overflowY !== 'auto') {
        element = element.parentElement;
      }
      return element!;
    });
  // Jump past rows that were never measured.
  await scroller.evaluate((element) => element.scrollTo(0, 30_000));
  await nextFrames(page);

  const id = (await visibleRowIds(page))[2]!;
  const row = page.getByText(new RegExp(`^#${id}: `));
  let top = (await row.boundingBox())!.y;
  for (let step = 0; step < 6; step++) {
    await scroller.evaluate((element) => element.scrollBy(0, -100));
    await nextFrames(page);
    const nextTop = (await row.boundingBox())!.y;
    expect(nextTop - top).toBeCloseTo(100, 0);
    top = nextTop;
  }
});
