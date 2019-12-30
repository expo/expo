import * as KeepAwake from 'expo-keep-awake';

export const name = 'KeepAwake';

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  describe(name, () => {
    afterAll(async () => {
      await KeepAwake.deactivateKeepAwake();
      await KeepAwake.deactivateKeepAwake('test-tag');
    });

    it(`keeps the screen on`, async () => {
      await KeepAwake.activateKeepAwake();
    });
    it(`keeps the screen on with a tag`, async () => {
      await KeepAwake.activateKeepAwake('test-tag');
    });
    it(`enables screen timeout`, async () => {
      await KeepAwake.deactivateKeepAwake();
    });
    it(`enables screen timeout with a tag`, async () => {
      await KeepAwake.deactivateKeepAwake('test-tag');
    });
  });
}
