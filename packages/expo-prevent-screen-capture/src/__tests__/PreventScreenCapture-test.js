import * as PreventScreenCapture from '../PreventScreenCapture';

describe('PreventScreenCapture', () => {
  it('activatePreventScreenCapture is defined', async () => {
    expect(PreventScreenCapture.activatePreventScreenCapture).toBeDefined();
  });

  it('deactivatePreventScreenCapture is defined', async () => {
    expect(PreventScreenCapture.deactivatePreventScreenCapture).toBeDefined();
  });

  it('usePreventScreenCapture hook is defined', async () => {
    expect(PreventScreenCapture.usePreventScreenCapture).toBeDefined();
  });
});
