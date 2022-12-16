/**
 * @jest-environment jsdom
 */

import * as Clipboard from '../Clipboard';

describe('Clipboard', () => {
  it('copies the provided string asynchronously', async () => {
    document.execCommand = jest.fn().mockReturnValueOnce(true);
    await expect(Clipboard.setStringAsync('Dumbledore')).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    // Browser needs to allow access to Clipboard, so the above will
    // be called, but it will fail.
  });

  it('copies the provided string with legacy setString', () => {
    document.execCommand = jest.fn().mockReturnValueOnce(true);
    expect(Clipboard.setString('Dumbledore')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
