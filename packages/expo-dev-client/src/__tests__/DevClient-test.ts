import * as DevClient from '../DevClient';

describe('DevClient', () => {
  it('DevMenu is defined', async () => {
    expect(DevClient.registerDevMenuItems).toBeDefined();
  });
});
