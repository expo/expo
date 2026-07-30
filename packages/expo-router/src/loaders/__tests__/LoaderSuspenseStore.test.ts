import { LoaderSuspenseStore } from '../LoaderSuspenseStore';

const tick = () => Promise.resolve();

describe(LoaderSuspenseStore, () => {
  it('stores and returns data, error, and promise entries', () => {
    const store = new LoaderSuspenseStore();
    const error = new Error('boom');
    const promise = Promise.resolve('v1');

    store.set('/data', { data: 'v1' });
    store.set('/error', { error });
    store.set('/pending', promise);

    expect(store.get('/data')).toEqual({ data: 'v1' });
    expect(store.get('/error')).toEqual({ error });
    expect(store.get('/pending')).toBe(promise);
    expect(store.get('/missing')).toBeUndefined();
  });

  it('seeds a key idempotently without replacing an existing entry', () => {
    const store = new LoaderSuspenseStore();
    store.seed('/p', 'seed');
    store.seed('/p', 'replacement');

    expect(store.get('/p')).toEqual({ data: 'seed' });
  });

  it('removes an entry on clear', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.clear('/p');

    expect(store.get('/p')).toBeUndefined();
  });

  it('does not remove an entry on dispose alone', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });

    store.dispose('/p');

    expect(store.get('/p')).toEqual({ data: 'v1' });
  });

  it('does not remove an entry on teardown alone', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });

    store.teardown('/p');

    expect(store.get('/p')).toEqual({ data: 'v1' });
  });

  it('removes an entry on dispose followed by teardown', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });

    store.dispose('/p');
    store.teardown('/p');

    expect(store.get('/p')).toBeUndefined();
  });

  it('unmarks a disposed key when a new entry is set', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.dispose('/p');

    store.set('/p', { data: 'v2' });
    store.teardown('/p');

    expect(store.get('/p')).toEqual({ data: 'v2' });
  });

  it('removes an error entry after the microtask on expireError', async () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { error: new Error('boom') });

    store.expireError('/p');
    expect(store.get('/p')).toEqual({ error: expect.any(Error) });

    await tick();
    expect(store.get('/p')).toBeUndefined();
  });

  it('does not expire an entry that was replaced before the deferred clear runs', async () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { error: new Error('boom') });

    store.expireError('/p');
    store.set('/p', { data: 'fresh' });
    await tick();

    expect(store.get('/p')).toEqual({ data: 'fresh' });
  });

  it('lists entry keys', () => {
    const store = new LoaderSuspenseStore();
    store.set('/a', { data: 1 });
    store.set('/b', { data: 2 });

    expect(store.keys()).toEqual(['/a', '/b']);
  });

  it('drops all entries and marks on reset', () => {
    const store = new LoaderSuspenseStore();
    store.set('/a', { data: 1 });
    store.dispose('/a');

    store.reset();
    store.set('/a', { data: 2 });
    store.teardown('/a');

    expect(store.get('/a')).toEqual({ data: 2 });
    expect(store.keys()).toEqual(['/a']);
  });
});
