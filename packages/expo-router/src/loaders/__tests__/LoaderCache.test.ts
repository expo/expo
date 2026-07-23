import { LoaderCache } from '../LoaderCache';

describe(LoaderCache, () => {
  describe('notify', () => {
    it('bumps the version and wakes subscribers', () => {
      const cache = new LoaderCache();
      const listener = jest.fn();
      cache.subscribe(listener);

      const before = cache.getSnapshot();
      cache.notify();

      expect(cache.getSnapshot()).toBe(before + 1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('drops errors, promises, and resets the Suspense store', () => {
      const cache = new LoaderCache();
      cache.setError('/error', new Error('test'));
      cache.setPromise('/pending', Promise.resolve('pending'));
      cache.suspense.set('/p', { data: 'v1' });

      cache.clear();

      expect(cache.getError('/error')).toBeUndefined();
      expect(cache.getPromise('/pending')).toBeUndefined();
      expect(cache.suspense.get('/p')).toBeUndefined();
    });
  });

  describe('invalidateAll', () => {
    it('resets the Suspense store and wakes subscribers', () => {
      const cache = new LoaderCache();
      cache.suspense.set('/p', { data: 'v1' });
      const listener = jest.fn();
      cache.subscribe(listener);
      const before = cache.getSnapshot();

      cache.invalidateAll();

      expect(cache.suspense.get('/p')).toBeUndefined();
      expect(cache.getSnapshot()).toBe(before + 1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('marks mounted loader paths for one forced revalidation', () => {
      const cache = new LoaderCache();
      cache.suspense.set('/mounted', { data: 'v1' });

      cache.invalidateAll({ revalidate: true });

      expect(cache.takeRevalidation('/missing')).toBe(false);
      expect(cache.takeRevalidation('/mounted')).toBe(true);
      expect(cache.takeRevalidation('/mounted')).toBe(false);
    });
  });
});
