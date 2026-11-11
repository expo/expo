import { getHeaderStatusBarHeight } from '../Header/getHeaderStatusBarHeight';

test('uses the top inset when the status bar is at the top', () => {
  expect(getHeaderStatusBarHeight({ top: 62, right: 0, bottom: 34, left: 0 }, null)).toBe(62);
});

test('offsets the header when the status bar is in a vertical bar', () => {
  expect(getHeaderStatusBarHeight({ top: 0, right: 84, bottom: 34, left: 0 }, 'trailing')).toBe(24);
});

test('keeps the header at the top edge without a vertical bar', () => {
  expect(getHeaderStatusBarHeight({ top: 0, right: 62, bottom: 21, left: 62 }, null)).toBe(0);
});
