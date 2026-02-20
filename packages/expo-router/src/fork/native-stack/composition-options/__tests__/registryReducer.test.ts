import { registryReducer } from '../CompositionOptionsContext';
import type { CompositionRegistry } from '../types';

describe('registryReducer', () => {
  describe('set action', () => {
    it('creates new entry with inner object for a new route key', () => {
      const state: CompositionRegistry = {};

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-1',
        options: { title: 'Hello' },
      });

      expect(result).not.toBe(state);
      expect('route-1' in result).toBe(true);
      expect(result['route-1']['comp-1']).toEqual({ title: 'Hello' });
    });

    it('adds component to existing route entry', () => {
      const state: CompositionRegistry = {
        'route-1': { 'comp-1': { title: 'First' } },
      };

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-2',
        options: { headerShown: false },
      });

      expect(result).not.toBe(state);
      expect(Object.keys(result['route-1']).length).toBe(2);
      expect(result['route-1']).not.toBe(state['route-1']); // New inner object
      expect(result['route-1']['comp-1']).toEqual({ title: 'First' });
      expect(result['route-1']['comp-2']).toEqual({ headerShown: false });
    });

    it('updates options when existing component registers different options', () => {
      const state: CompositionRegistry = {
        'route-1': { 'comp-1': { title: 'Old' } },
      };

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-1',
        options: { title: 'New' },
      });

      expect(result).not.toBe(state);
      expect(result['route-1']).not.toBe(state['route-1']); // New inner object
      expect(result['route-1']['comp-1']).not.toBe(state['route-1']['comp-1']); // New options object
      expect(result['route-1']['comp-1']).toEqual({ title: 'New' });
    });

    it('returns same state reference when options reference is identical', () => {
      const options = { title: 'Unchanged' };
      const state: CompositionRegistry = {
        'route-1': { 'comp-1': options },
      };

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-1',
        options,
      });

      expect(result).toBe(state);
    });

    it('creates both outer and inner entries for first registration', () => {
      const state: CompositionRegistry = {};

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-new',
        componentId: 'comp-new',
        options: { title: 'Brand New' },
      });

      expect(Object.keys(result).length).toBe(1);
      expect(Object.keys(result['route-new']).length).toBe(1);
      expect(result['route-new']['comp-new']).toEqual({ title: 'Brand New' });
    });
  });

  describe('unregister action', () => {
    it('removes component from route entry, keeps route', () => {
      const state: CompositionRegistry = {
        'route-1': {
          'comp-1': { title: 'First' },
          'comp-2': { headerShown: false },
        },
      };

      const result = registryReducer(state, {
        type: 'unregister',
        routeKey: 'route-1',
        componentId: 'comp-1',
      });

      expect(result).not.toBe(state);
      expect(Object.keys(result['route-1']).length).toBe(1);
      expect(result['route-1']).not.toBe(state['route-1']); // New inner object
      expect('comp-1' in result['route-1']).toBe(false);
      expect('comp-2' in result['route-1']).toBe(true);
    });

    it('deletes entire route entry when last component is unregistered', () => {
      const state: CompositionRegistry = {
        'route-1': { 'comp-1': { title: 'Only' } },
      };

      const result = registryReducer(state, {
        type: 'unregister',
        routeKey: 'route-1',
        componentId: 'comp-1',
      });

      expect(result).not.toBe(state);
      expect('route-1' in result).toBe(false);
      expect(Object.keys(result).length).toBe(0);
    });

    it('returns same state reference for non-existent route key', () => {
      const state: CompositionRegistry = {
        'route-1': { 'comp-1': { title: 'Exists' } },
      };

      const result = registryReducer(state, {
        type: 'unregister',
        routeKey: 'route-missing',
        componentId: 'comp-1',
      });

      expect(result).toBe(state);
    });

    it('returns same state reference for non-existent component ID', () => {
      const state: CompositionRegistry = {
        'route-1': { 'comp-1': { title: 'Exists' } },
      };

      const result = registryReducer(state, {
        type: 'unregister',
        routeKey: 'route-1',
        componentId: 'comp-missing',
      });

      expect(result).toBe(state);
    });
  });

  describe('unknown action', () => {
    it('returns same state reference for unknown action type', () => {
      const state: CompositionRegistry = {
        'route-1': { 'comp-1': { title: 'Unchanged' } },
      };

      const result = registryReducer(state, {
        type: 'unknown' as any,
        routeKey: 'route-1',
        componentId: 'comp-1',
      });

      expect(result).toBe(state);
    });
  });
});
