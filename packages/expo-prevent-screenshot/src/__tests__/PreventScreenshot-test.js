import * as PreventScreenshot from '../PreventScreenshot';

describe('PreventScreenshot', () => {
  it('activatePreventScreenshot is defined', async () => {
    expect(PreventScreenshot.activatePreventScreenshot).toBeDefined();
  });

  it('deactivatePreventScreenshot is defined', async () => {
    expect(PreventScreenshot.deactivatePreventScreenshot).toBeDefined();
  });

  it('usePreventScreenshot hook is defined', async () => {
    expect(PreventScreenshot.usePreventScreenshot).toBeDefined();
  });
});
