import { expect, type Page, test } from '@playwright/test';

const PANEL = 'expo-ui-bottom-sheet';
const OVERLAY = 'expo-ui-bottom-sheet-overlay';
const HANDLE = 'expo-ui-bottom-sheet-handle';

function openByTestId(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"][data-state="open"]`);
}

function openHandle(page: Page) {
  return openByTestId(page, PANEL).getByTestId(HANDLE);
}

function openPanel(page: Page) {
  return openByTestId(page, PANEL);
}

async function gotoCommunity(page: Page) {
  await page.goto('/components/ui/community-bottomsheet', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('BottomSheet (snap points)')).toBeVisible({ timeout: 60_000 });
}

async function gotoUniversal(page: Page) {
  await page.goto('/components/ui-universal/bottom-sheet', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Open basic sheet' })).toBeVisible({
    timeout: 60_000,
  });
}

async function clickFirstButtonAfter(page: Page, uniqueText: string) {
  await page
    .getByText(uniqueText, { exact: true })
    .locator('xpath=following::*[@role="button"][1]')
    .click();
}

async function dragPanel(page: Page, dy: number, { release = true }: { release?: boolean } = {}) {
  const panel = openPanel(page);
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  if (!box) {
    throw new Error('Panel bounding box missing');
  }
  const viewport = page.viewportSize();
  const startX = box.x + box.width / 2;
  const startY = box.y + 8;
  const rawEndY = startY + dy;
  const endY = viewport ? Math.min(Math.max(rawEndY, 2), viewport.height - 2) : rawEndY;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, endY, { steps: 24 });
  if (release) {
    await page.mouse.up();
  }
}

async function clickOverlayTop(page: Page) {
  const overlay = openByTestId(page, OVERLAY);
  await expect(overlay).toBeVisible();
  const box = await overlay.boundingBox();
  if (!box) {
    throw new Error('Overlay bounding box missing');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + 16);
}

test.describe('Community BottomSheet screen', () => {
  test('should open the snap-point sheet via Open and show title, panel, and overlay', async ({
    page,
  }) => {
    await gotoCommunity(page);
    await clickFirstButtonAfter(page, 'snapPoints: 25%, 50%, 90%');

    await expect(openPanel(page)).toBeVisible();
    await expect(openByTestId(page, OVERLAY)).toBeVisible();
    await expect(openPanel(page).getByText('BottomSheet', { exact: true })).toBeVisible();
  });

  test('should dismiss from the in-sheet Close button and log onClose and onChange -1', async ({
    page,
  }) => {
    await gotoCommunity(page);
    await clickFirstButtonAfter(page, 'snapPoints: 25%, 50%, 90%');
    await expect(openPanel(page).getByText('BottomSheet', { exact: true })).toBeVisible();

    await openPanel(page).getByRole('button', { name: 'Close' }).click();

    await expect(openByTestId(page, OVERLAY)).toHaveCount(0);
    await expect(page.getByText(/sheet onClose/)).toBeVisible();
    await expect(page.getByText(/sheet onChange: -1/)).toBeVisible();
  });

  test('should increase sheet height when snapping from Snap 1 to Snap 2', async ({ page }) => {
    await gotoCommunity(page);
    await clickFirstButtonAfter(page, 'snapPoints: 25%, 50%, 90%');
    await expect(openPanel(page)).toBeVisible();

    await openPanel(page).getByRole('button', { name: 'Snap 1' }).click();
    const midBox = await openPanel(page).boundingBox();
    if (!midBox) {
      throw new Error('Mid snap bounding box missing');
    }

    await openPanel(page).getByRole('button', { name: 'Snap 2' }).click();
    await expect
      .poll(async () => {
        const next = await openPanel(page).boundingBox();
        return next?.height ?? 0;
      })
      .toBeGreaterThan(midBox.height + 20);
  });

  test('should dismiss when the overlay is clicked while pan-down-to-close is enabled', async ({
    page,
  }) => {
    await gotoCommunity(page);
    await clickFirstButtonAfter(page, 'snapPoints: 25%, 50%, 90%');
    await expect(openByTestId(page, OVERLAY)).toBeVisible();

    await clickOverlayTop(page);

    await expect(openByTestId(page, OVERLAY)).toHaveCount(0);
    await expect(page.getByText(/sheet onClose/)).toBeVisible();
  });

  test('should dismiss on Escape on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Escape is a desktop keyboard gesture');

    await gotoCommunity(page);
    await clickFirstButtonAfter(page, 'snapPoints: 25%, 50%, 90%');
    await expect(openPanel(page)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(openByTestId(page, OVERLAY)).toHaveCount(0);
    await expect(page.getByText(/sheet onClose/)).toBeVisible();
  });

  test('should dismiss or snap lower when the handle is dragged down', async ({ page }) => {
    await gotoCommunity(page);
    await clickFirstButtonAfter(page, 'snapPoints: 25%, 50%, 90%');
    await expect(openHandle(page)).toBeVisible();

    await openPanel(page).getByRole('button', { name: 'Snap 2' }).click();
    await expect
      .poll(async () => (await openPanel(page).boundingBox())?.height ?? 0)
      .toBeGreaterThan(400);

    const before = await openPanel(page).boundingBox();
    if (!before) {
      throw new Error('Panel bounding box missing');
    }

    const viewport = page.viewportSize();
    await dragPanel(page, viewport ? viewport.height : 500);

    await expect
      .poll(async () => {
        const overlayGone = (await openByTestId(page, OVERLAY).count()) === 0;
        const after = overlayGone ? null : await openPanel(page).boundingBox();
        const movedDown = after != null && after.y > before.y + 20;
        const snappedLower = after != null && after.height < before.height - 20;
        return overlayGone || movedDown || snappedLower;
      })
      .toBeTruthy();
  });

  test('should present BottomSheetModal from Open and start closed on load', async ({ page }) => {
    await gotoCommunity(page);
    await expect(openPanel(page)).toHaveCount(0);

    await clickFirstButtonAfter(page, 'snapPoints: 40%, 80%');
    await expect(openPanel(page).getByText('BottomSheetModal', { exact: true })).toBeVisible();
    await expect(openPanel(page)).toBeVisible();
  });

  test('should open a fit-to-content modal shorter than the 90% snap sheet', async ({ page }) => {
    await gotoCommunity(page);

    await clickFirstButtonAfter(page, 'snapPoints: 25%, 50%, 90%');
    await openPanel(page).getByRole('button', { name: 'Snap 2' }).click();
    await expect
      .poll(async () => (await openPanel(page).boundingBox())?.height ?? 0)
      .toBeGreaterThan(400);
    const snapBox = await openPanel(page).boundingBox();
    if (!snapBox) {
      throw new Error('Snap sheet bounding box missing');
    }
    await openPanel(page).getByRole('button', { name: 'Close' }).click();
    await expect(openByTestId(page, OVERLAY)).toHaveCount(0);

    await clickFirstButtonAfter(page, 'No snapPoints — sheet sizes to content');
    await expect(openPanel(page).getByText('Fit to Content')).toBeVisible();
    const fitBox = await openPanel(page).boundingBox();
    if (!fitBox) {
      throw new Error('Fit sheet bounding box missing');
    }

    expect(fitBox.height).toBeLessThan(snapBox.height - 20);
  });
});

test.describe('Universal BottomSheet screen', () => {
  test('should open the basic sheet and dismiss from Close', async ({ page }) => {
    await gotoUniversal(page);
    await page.getByRole('button', { name: 'Open basic sheet' }).click();

    await expect(page.getByText('Hello from BottomSheet')).toBeVisible();
    await openPanel(page).getByRole('button', { name: 'Close' }).click();
    await expect(openPanel(page)).toHaveCount(0);
  });

  test('should hide the handle when opening the no-drag-indicator sheet', async ({ page }) => {
    await gotoUniversal(page);
    await page.getByRole('button', { name: 'Open sheet (no drag indicator)' }).click();

    await expect(page.getByText('No drag indicator', { exact: true })).toBeVisible();
    await expect(openHandle(page)).toHaveCount(0);
  });

  test('should grow when dragging the half/full snap sheet toward full', async ({ page }) => {
    await gotoUniversal(page);
    await page.getByRole('button', { name: 'Open sheet with snap points (half / full)' }).click();
    await expect(page.getByText('Snap points: half / full')).toBeVisible();

    const before = await openPanel(page).boundingBox();
    if (!before) {
      throw new Error('Universal snap sheet bounding box missing');
    }

    await dragPanel(page, -280, { release: false });

    await expect
      .poll(async () => {
        const next = await openPanel(page).boundingBox();
        if (!next) return 0;
        return Math.max(before.y - next.y, next.height - before.height);
      })
      .toBeGreaterThan(20);

    await page.mouse.up();
  });

  test('should call onDismiss when the overlay is tapped', async ({ page }) => {
    await gotoUniversal(page);
    await page.getByRole('button', { name: 'Open basic sheet' }).click();
    await expect(page.getByText('Hello from BottomSheet')).toBeVisible();

    await clickOverlayTop(page);

    await expect(openPanel(page)).toHaveCount(0);
  });

  test('should keep the sheet open while scrolling nested content and still dismiss from the handle', async ({
    page,
  }) => {
    await gotoUniversal(page);
    await page.getByRole('button', { name: 'Open sheet with snap points (half / full)' }).click();
    await expect(page.getByText('Snap points: half / full')).toBeVisible();

    await openPanel(page).getByText('Filler — line 1.').hover();
    await page.mouse.wheel(0, 240);
    await expect(openPanel(page)).toBeVisible();
    await expect(page.getByText('Snap points: half / full')).toBeVisible();

    const viewport = page.viewportSize();
    await dragPanel(page, viewport ? viewport.height : 500);
    await expect(openByTestId(page, OVERLAY)).toHaveCount(0);
  });
});
