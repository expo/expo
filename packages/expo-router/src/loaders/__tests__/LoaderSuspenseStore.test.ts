import { LoaderSuspenseStore } from '../LoaderSuspenseStore';

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

  it('removes entries only after both disposal and teardown', () => {
    const store = new LoaderSuspenseStore();
    store.set('/disposed', { data: 'disposed' });
    store.set('/torn-down', { data: 'torn-down' });
    store.set('/reclaimed', { data: 'reclaimed' });

    store.dispose('/disposed');
    store.teardown('/torn-down');
    store.dispose('/reclaimed');
    store.teardown('/reclaimed');

    expect(store.get('/disposed')).toEqual({ data: 'disposed' });
    expect(store.get('/torn-down')).toEqual({ data: 'torn-down' });
    expect(store.get('/reclaimed')).toBeUndefined();
  });

  it('unmarks a disposed key when a new entry is set', () => {
    const store = new LoaderSuspenseStore();
    store.set('/p', { data: 'v1' });
    store.dispose('/p');

    store.set('/p', { data: 'v2' });
    store.teardown('/p');

    expect(store.get('/p')).toEqual({ data: 'v2' });
  });

  it('retains live entries and clears inactive entries', () => {
    const store = new LoaderSuspenseStore();
    store.set('/live', { data: 'fresh' });
    store.set('/inactive', { data: 'stale' });
    store.dispose('/inactive');

    store.retain(new Set(['/live']));

    expect(store.get('/live')).toEqual({ data: 'fresh' });
    expect(store.get('/inactive')).toBeUndefined();
    store.set('/inactive', { data: 'new' });
    store.teardown('/inactive');
    expect(store.get('/inactive')).toEqual({ data: 'new' });
  });

  it('drops all entries and marks on reset', () => {
    const store = new LoaderSuspenseStore();
    store.set('/a', { data: 1 });
    store.dispose('/a');

    store.reset();
    store.set('/a', { data: 2 });
    store.teardown('/a');

    expect(store.get('/a')).toEqual({ data: 2 });
  });
});
