import * as Clipboard from '../Clipboard';
import ExpoClipboard from '../ExpoClipboard';

jest.mock('../ExpoClipboard', () => ({
  setStringAsync: jest.fn(),
}));

describe('Clipboard', () => {
  it('getStringAsync', () => {
    expect(Clipboard.getStringAsync).toBeDefined();
  });
  it('setString', () => {
    expect(Clipboard.setString).toBeDefined();
  });
  it('setStringAsync', () => {
    expect(Clipboard.setStringAsync).toBeDefined();
  });
  it('setString delegates to native setStringAsync', () => {
    Clipboard.setString('test');
    expect(ExpoClipboard.setStringAsync).toHaveBeenCalledWith('test', {});
  });
  it('addClipboardListener', () => {
    expect(Clipboard.addClipboardListener).toBeDefined();
  });
  it('removeClipboardListener', () => {
    expect(Clipboard.removeClipboardListener).toBeDefined();
  });
});
