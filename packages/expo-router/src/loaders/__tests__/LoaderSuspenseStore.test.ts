import { LoaderSuspenseStore } from '../LoaderSuspenseStore';

const tick = () => Promise.resolve();

describe(LoaderSuspenseStore, () => {
  it('stores and returns a settled entry', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });

    expect(store.get('/p')).toEqual({ data: 'v1' });
  });

  it('seeds a key idempotently without replacing an existing read', () => {
    const store = new LoaderSuspenseStore();
    store.seed('/p', 'seed');
    store.seed('/p', 'replacement');

    expect(store.get('/p')).toEqual({ data: 'seed' });
  });

  it('stores and returns a pending promise', () => {
    const store = new LoaderSuspenseStore();
    const promise = Promise.resolve('v1');
    store.set('/p', promise);

    expect(store.get('/p')).toBe(promise);
  });

  it('returns undefined for an unknown key', () => {
    const store = new LoaderSuspenseStore();
    expect(store.get('/missing')).toBeUndefined();
  });

  it('removes an entry on clear', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.clear('/p');

    expect(store.get('/p')).toBeUndefined();
  });

  it('reclaims an entry once the last reader releases it (deferred)', async () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.retain('/p');

    store.release('/p');
    // Reclaim is deferred, so the entry survives until the microtask runs.
    expect(store.get('/p')).toEqual({ data: 'v1' });

    await tick();
    expect(store.get('/p')).toBeUndefined();
  });

  it('keeps an entry while more than one reader retains it', async () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.retain('/p');
    store.retain('/p');

    store.release('/p');
    await tick();
    // One reader is still mounted, so the entry stays.
    expect(store.get('/p')).toEqual({ data: 'v1' });

    store.release('/p');
    await tick();
    expect(store.get('/p')).toBeUndefined();
  });

  it('keeps an entry across an unmount + remount within the same tick (Strict Mode safe)', async () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.retain('/p');

    store.release('/p');
    store.retain('/p'); // remount before the deferred reclaim runs
    await tick();

    expect(store.get('/p')).toEqual({ data: 'v1' });
  });

  it('does not double-consume a seed across a StrictMode remount', async () => {
    const store = new LoaderSuspenseStore();
    store.seed('/p', 'seed');
    store.retain('/p');

    store.release('/p');
    store.retain('/p');
    store.seed('/p', 'replacement');
    await tick();

    expect(store.get('/p')).toEqual({ data: 'seed' });
  });

  it('does not reclaim a key that was re-set after release', async () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.retain('/p');
    store.release('/p');

    // A fresh write before the microtask should cancel the pending reclaim.
    store.set('/p', { data: 'v2' });
    await tick();

    expect(store.get('/p')).toEqual({ data: 'v2' });
  });

  it('drops all entries and refcounts on reset', () => {
    const store = new LoaderSuspenseStore();
    store.set('/a', { data: 1 });
    store.set('/b', { data: 2 });

    store.reset();

    expect(store.get('/a')).toBeUndefined();
    expect(store.get('/b')).toBeUndefined();
  });
});
