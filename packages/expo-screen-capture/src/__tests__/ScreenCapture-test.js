import * as ScreenCapture from '../ScreenCapture';

describe('ScreenCapture methods are defined', () => {
  it('activatePreventScreenCapture is defined', async () => {
    expect(ScreenCapture.activatePreventScreenCapture).toBeDefined();
  });

  it('deactivatePreventScreenCapture is defined', async () => {
    expect(ScreenCapture.deactivatePreventScreenCapture).toBeDefined();
  });

  it('usePreventScreenCapture hook is defined', async () => {
    expect(ScreenCapture.usePreventScreenCapture).toBeDefined();
  });
});
