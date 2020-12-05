/**
 * @jest-environment jsdom
 */

import Clipboard from '../Clipboard';

describe('Clipboard', () => {
  it('copies the provided string', async () => {
    document.execCommand = jest.fn();
    Clipboard.setStringAsync('Dumbledore');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    // Browser needs to allow access to Clipboard, so the above will
    // be called, but it will fail.
  });
});
