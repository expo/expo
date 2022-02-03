/**
 * @jest-environment jsdom
 */

import * as Clipboard from '../Clipboard';

describe('Clipboard', () => {
  it('copies the provided string', () => {
    document.execCommand = jest.fn();
    Clipboard.setString('Dumbledore');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    // Browser needs to allow access to Clipboard, so the above will
    // be called, but it will fail.
  });
});
