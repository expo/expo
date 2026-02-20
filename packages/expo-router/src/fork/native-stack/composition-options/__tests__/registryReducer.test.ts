import { registryReducer } from '../CompositionOptionsContext';
import type { CompositionRegistry } from '../types';

describe('registryReducer', () => {
  describe('set action', () => {
    it('creates new array entry for a new route key', () => {
      const state: CompositionRegistry = {};
      const options = { title: 'Hello' };

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        options,
      });

      expect(result).not.toBe(state);
      expect(result['route-1']).toEqual([{ title: 'Hello' }]);
      expect(result['route-1'][0]).toBe(options);
    });

    it('appends options to existing route entry', () => {
      const first = { title: 'First' };
      const state: CompositionRegistry = {
        'route-1': [first],
      };
      const second = { headerShown: false as const };

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        options: second,
      });

      expect(result).not.toBe(state);
      expect(result['route-1']).toHaveLength(2);
      expect(result['route-1']).not.toBe(state['route-1']); // New array
      expect(result['route-1'][0]).toBe(first);
      expect(result['route-1'][1]).toBe(second);
    });

    it('returns same state reference when options reference is already in array', () => {
      const options = { title: 'Unchanged' };
      const state: CompositionRegistry = {
        'route-1': [options],
      };

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        options,
      });

      expect(result).toBe(state);
    });

    it('appends options with same shape but different reference', () => {
      const state: CompositionRegistry = {
        'route-1': [{ title: 'Hello' }],
      };

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        options: { title: 'Hello' },
      });

      expect(result).not.toBe(state);
      expect(result['route-1']).toHaveLength(2);
    });

    it('creates route entry for first registration', () => {
      const state: CompositionRegistry = {};

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-new',
        options: { title: 'Brand New' },
      });

      expect(Object.keys(result)).toHaveLength(1);
      expect(result['route-new']).toHaveLength(1);
      expect(result['route-new'][0]).toEqual({ title: 'Brand New' });
    });
  });

  describe('unset action', () => {
    it('removes options by reference, keeps route', () => {
      const first = { title: 'First' };
      const second = { headerShown: false as const };
      const state: CompositionRegistry = {
        'route-1': [first, second],
      };

      const result = registryReducer(state, {
        type: 'unset',
        routeKey: 'route-1',
        options: first,
      });

      expect(result).not.toBe(state);
      expect(result['route-1']).toHaveLength(1);
      expect(result['route-1']).not.toBe(state['route-1']); // New array
      expect(result['route-1'][0]).toBe(second);
    });

    it('deletes entire route entry when last options is removed', () => {
      const options = { title: 'Only' };
      const state: CompositionRegistry = {
        'route-1': [options],
      };

      const result = registryReducer(state, {
        type: 'unset',
        routeKey: 'route-1',
        options,
      });

      expect(result).not.toBe(state);
      expect('route-1' in result).toBe(false);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('returns same state reference for non-existent route key', () => {
      const options = { title: 'Exists' };
      const state: CompositionRegistry = {
        'route-1': [options],
      };

      const result = registryReducer(state, {
        type: 'unset',
        routeKey: 'route-missing',
        options,
      });

      expect(result).toBe(state);
    });

    it('returns same state reference for non-matching options reference', () => {
      const state: CompositionRegistry = {
        'route-1': [{ title: 'Exists' }],
      };

      const result = registryReducer(state, {
        type: 'unset',
        routeKey: 'route-1',
        options: { title: 'Exists' }, // Same shape, different reference
      });

      expect(result).toBe(state);
    });
  });

  describe('unknown action', () => {
    it('returns same state reference for unknown action type', () => {
      const state: CompositionRegistry = {
        'route-1': [{ title: 'Unchanged' }],
      };

      const result = registryReducer(state, {
        type: 'unknown' as any,
        routeKey: 'route-1',
        options: { title: 'Unchanged' },
      });

      expect(result).toBe(state);
    });
  });
});
