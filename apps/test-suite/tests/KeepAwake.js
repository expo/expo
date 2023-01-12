import * as KeepAwake from 'expo-keep-awake';

export const name = 'KeepAwake';

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  describe(name, () => {
    afterAll(async () => {
      if (await KeepAwake.isAvailableAsync()) {
        await KeepAwake.deactivateKeepAwake();
        await KeepAwake.deactivateKeepAwake('test-tag');
      }
    });

    it(`keeps the screen on`, async () => {
      if (await KeepAwake.isAvailableAsync()) {
        await KeepAwake.activateKeepAwakeAsync();
      }
    });
    it(`keeps the screen on with a tag`, async () => {
      if (await KeepAwake.isAvailableAsync()) {
        await KeepAwake.activateKeepAwakeAsync('test-tag');
      }
    });
    it(`enables screen timeout`, async () => {
      if (await KeepAwake.isAvailableAsync()) {
        await KeepAwake.deactivateKeepAwake();
      }
    });
    it(`enables screen timeout with a tag`, async () => {
      if (await KeepAwake.isAvailableAsync()) {
        await KeepAwake.deactivateKeepAwake('test-tag');
      }
    });
  });
}
