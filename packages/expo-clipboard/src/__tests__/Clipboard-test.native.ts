import * as Clipboard from '../Clipboard';

describe('Clipboard', () => {
  it('getStringAsync', () => {
    expect(Clipboard.getStringAsync).toBeDefined();
  });
  it('setStringAsync', () => {
    expect(Clipboard.setStringAsync).toBeDefined();
  });
  it('addClipboardListener', () => {
    expect(Clipboard.addClipboardListener).toBeDefined();
  });
  it('removeClipboardListener', () => {
    expect(Clipboard.removeClipboardListener).toBeDefined();
  });
});
