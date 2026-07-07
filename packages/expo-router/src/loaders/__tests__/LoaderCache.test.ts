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
    it('drops document data and resets the Suspense store', () => {
      const cache = new LoaderCache();
      cache.setData('/p', 'v1');
      cache.suspense.set('/p', { data: 'v1' });

      cache.clear();

      expect(cache.hasData('/p')).toBe(false);
      expect(cache.suspense.get('/p')).toBeUndefined();
    });
  });

  describe('invalidateAll', () => {
    it('drops document data, resets the Suspense store, and wakes subscribers', () => {
      const cache = new LoaderCache();
      cache.setData('/p', 'v1');
      cache.suspense.set('/p', { data: 'v1' });
      const listener = jest.fn();
      cache.subscribe(listener);
      const before = cache.getSnapshot();

      cache.invalidateAll();

      expect(cache.hasData('/p')).toBe(false);
      expect(cache.suspense.get('/p')).toBeUndefined();
      expect(cache.getSnapshot()).toBe(before + 1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
