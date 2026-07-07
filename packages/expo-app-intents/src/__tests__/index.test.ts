import * as AppIntents from '../index';

describe('expo-app-intents on unsupported platforms', () => {
  it('reports unavailability', () => {
    expect(AppIntents.isAvailable()).toBe(false);
  });

  it('returns empty pending invocations', async () => {
    await expect(AppIntents.getPendingInvocationsAsync()).resolves.toEqual([]);
  });

  it('returns an empty entity catalog', async () => {
    await expect(AppIntents.getEntityCatalogAsync('dish')).resolves.toEqual([]);
  });

  it('resolves no-op mutations', async () => {
    await expect(AppIntents.removePendingInvocationAsync('x')).resolves.toBeUndefined();
    await expect(AppIntents.clearPendingInvocationsAsync()).resolves.toBeUndefined();
    await expect(
      AppIntents.setEntityCatalogAsync('dish', [{ id: 'margherita', title: 'Margherita Pizza' }])
    ).resolves.toBeUndefined();
  });

  it('rejects refreshShortcutsAsync with UnavailabilityError', async () => {
    await expect(AppIntents.refreshShortcutsAsync()).rejects.toThrow(/not available/);
  });

  it('returns an inert subscription from addAppIntentListener', () => {
    const subscription = AppIntents.addAppIntentListener(() => {});
    expect(typeof subscription.remove).toBe('function');
    subscription.remove();
  });

  it('exports useAppIntents hook', () => {
    expect(typeof AppIntents.useAppIntents).toBe('function');
  });

  it('creates an app entity identifier modifier config', () => {
    expect(AppIntents.appEntityIdentifier('person', 'maya-chen')).toEqual({
      $type: 'appEntityIdentifier',
      entity: 'person',
      id: 'maya-chen',
    });
  });
});
