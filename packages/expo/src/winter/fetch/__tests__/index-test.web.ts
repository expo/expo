/** @jest-environment node */

describe('expo/fetch on web', () => {
  it('exports the platform Request so it works with the platform fetch', () => {
    class PlatformRequest {}
    globalThis.Request = PlatformRequest as unknown as typeof Request;
    const { Request } = require('../index');
    expect(Request).toBe(PlatformRequest);
  });
});
