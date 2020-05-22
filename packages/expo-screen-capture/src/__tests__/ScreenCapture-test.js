import * as ScreenCapture from '../ScreenCapture';

describe('ScreenCapture methods are defined', () => {
  it('preventScreenCapture is defined', async () => {
    expect(ScreenCapture.preventScreenCapture).toBeDefined();
  });

  it('allowScreenCapture is defined', async () => {
    expect(ScreenCapture.allowScreenCapture).toBeDefined();
  });

  it('usePreventScreenCapture hook is defined', async () => {
    expect(ScreenCapture.usePreventScreenCapture).toBeDefined();
  });
});
