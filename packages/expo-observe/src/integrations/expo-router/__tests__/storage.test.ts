import { createRouterIntegrationStorage } from '../storage';

describe('createRouterIntegrationStorage', () => {
  it('returns isolated instances', () => {
    const a = createRouterIntegrationStorage();
    const b = createRouterIntegrationStorage();
    expect(a).not.toBe(b);
    expect(a.screenTimes).not.toBe(b.screenTimes);
    expect(a.interactiveScreensIds).not.toBe(b.interactiveScreensIds);
    expect(a.renderedScreensIds).not.toBe(b.renderedScreensIds);
    expect(a.pendingActions).not.toBe(b.pendingActions);
  });

  it('initializes empty collections and default flags', () => {
    const storage = createRouterIntegrationStorage();
    expect(storage.pendingActions).toEqual([]);
    expect(storage.renderedScreensIds.size).toBe(0);
    expect(storage.hasRecordedInitialTtr).toBe(false);
    expect(storage.screenTimes).toEqual({});
    expect(storage.interactiveScreensIds.size).toBe(0);
  });
});
