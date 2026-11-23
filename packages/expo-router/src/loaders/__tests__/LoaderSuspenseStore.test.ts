import { LoaderSuspenseStore } from '../LoaderSuspenseStore';

describe(LoaderSuspenseStore, () => {
  it('keeps one wakeable through a refresh and writes its value before waking', async () => {
    const store = new LoaderSuspenseStore();
    const pending = store.suspend('/p');
    expect(store.suspend('/p')).toBe(pending);
    expect(store.seed('/p', 'late hydration')).toBe(false);

    store.settle('/p', { data: 'fresh' });
    await pending;

    expect(store.value('/p')).toEqual({ data: 'fresh' });
    expect(store.pending('/p')).toBeUndefined();
  });

  it('clears its value and wakeable before waking released readers', async () => {
    const store = new LoaderSuspenseStore();
    store.seed('/p', 'old');
    const pending = store.suspend('/p');
    const observed = pending.then(() => {
      expect(store.value('/p')).toBeUndefined();
      expect(store.pending('/p')).toBeUndefined();
    });

    store.release('/p');
    await observed;
  });

  it('does not repeat versions after releasing and recreating a path', () => {
    const store = new LoaderSuspenseStore();
    store.seed('/p', 'old');
    const original = store.version('/p');
    store.release('/p');
    const released = store.version('/p');
    store.seed('/other', 'other');
    const other = store.version('/other');
    store.seed('/p', 'new');

    expect(released).toBeGreaterThan(original);
    expect(other).toBeGreaterThan(released);
    expect(store.version('/p')).toBeGreaterThan(other);
  });
});
