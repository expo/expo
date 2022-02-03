import * as Clipboard from '../Clipboard';

describe('Clipboard', () => {
  it('getStringAsync', () => {
    expect(Clipboard.getStringAsync).toBeDefined();
  });
  it('setString', () => {
    expect(Clipboard.setString).toBeDefined();
  });
  it('addClipboardListener', () => {
    expect(Clipboard.addClipboardListener).toBeDefined();
  });
  it('removeClipboardListener', () => {
    expect(Clipboard.removeClipboardListener).toBeDefined();
  });
});
