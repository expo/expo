import * as SystemUI from '../SystemUI';

describe('SystemUI', () => {
  it('setNavigationBarBackgroundColor is defined', async () => {
    expect(SystemUI.setNavigationBarBackgroundColor).toBeDefined();
  });
  it('setNavigationBarVisibility is defined', async () => {
    expect(SystemUI.setNavigationBarVisibility).toBeDefined();
  });
});
