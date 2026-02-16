import { registryReducer } from '../CompositionOptionsContext';
import type { CompositionRegistry } from '../types';

describe('registryReducer', () => {
  describe('set action', () => {
    it('creates new outer Map entry with inner Map for a new route key', () => {
      const state: CompositionRegistry = new Map();

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-1',
        options: { title: 'Hello' },
      });

      expect(result).not.toBe(state);
      expect(result.has('route-1')).toBe(true);
      expect(result.get('route-1')!.get('comp-1')).toEqual({ title: 'Hello' });
    });

    it('adds component to existing route inner Map', () => {
      const state: CompositionRegistry = new Map([
        ['route-1', new Map([['comp-1', { title: 'First' }]])],
      ]);

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-2',
        options: { headerShown: false },
      });

      expect(result).not.toBe(state);
      expect(result.get('route-1')!.size).toBe(2);
      expect(result.get('route-1')).not.toBe(state.get('route-1')); // New inner Map instance
      expect(result.get('route-1')!.get('comp-1')).toEqual({ title: 'First' });
      expect(result.get('route-1')!.get('comp-2')).toEqual({ headerShown: false });
    });

    it('updates options when existing component registers different options', () => {
      const state: CompositionRegistry = new Map([
        ['route-1', new Map([['comp-1', { title: 'Old' }]])],
      ]);

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-1',
        options: { title: 'New' },
      });

      expect(result).not.toBe(state);
      expect(result.get('route-1')!).not.toBe(state.get('route-1')); // New inner Map instance
      expect(result.get('route-1')!.get('comp-1')).not.toBe(state.get('route-1')!.get('comp-1')); // New options object
      expect(result.get('route-1')!.get('comp-1')).toEqual({ title: 'New' });
    });

    it('returns same state reference when options are deepEqual', () => {
      const state: CompositionRegistry = new Map([
        ['route-1', new Map([['comp-1', { title: 'Same', headerShown: true }]])],
      ]);

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-1',
        componentId: 'comp-1',
        options: { title: 'Same', headerShown: true },
      });

      expect(result).toBe(state);
    });

    it('creates both outer and inner Maps for first registration', () => {
      const state: CompositionRegistry = new Map();

      const result = registryReducer(state, {
        type: 'set',
        routeKey: 'route-new',
        componentId: 'comp-new',
        options: { title: 'Brand New' },
      });

      expect(result.size).toBe(1);
      expect(result.get('route-new')!.size).toBe(1);
      expect(result.get('route-new')!.get('comp-new')).toEqual({ title: 'Brand New' });
    });
  });

  describe('unregister action', () => {
    it('removes component from inner Map, keeps route entry', () => {
      const state: CompositionRegistry = new Map([
        [
          'route-1',
          new Map([
            ['comp-1', { title: 'First' }],
            ['comp-2', { headerShown: false }],
          ]),
        ],
      ]);

      const result = registryReducer(state, {
        type: 'unregister',
        routeKey: 'route-1',
        componentId: 'comp-1',
      });

      expect(result).not.toBe(state);
      expect(result.get('route-1')!.size).toBe(1);
      expect(result.get('route-1')).not.toBe(state.get('route-1')); // New inner Map instance
      expect(result.get('route-1')!.has('comp-1')).toBe(false);
      expect(result.get('route-1')!.has('comp-2')).toBe(true);
    });

    it('deletes entire route entry when last component is unregistered', () => {
      const state: CompositionRegistry = new Map([
        ['route-1', new Map([['comp-1', { title: 'Only' }]])],
      ]);

      const result = registryReducer(state, {
        type: 'unregister',
        routeKey: 'route-1',
        componentId: 'comp-1',
      });

      expect(result).not.toBe(state);
      expect(result.has('route-1')).toBe(false);
      expect(result.size).toBe(0);
    });

    it('returns same state reference for non-existent route key', () => {
      const state: CompositionRegistry = new Map([
        ['route-1', new Map([['comp-1', { title: 'Exists' }]])],
      ]);

      const result = registryReducer(state, {
        type: 'unregister',
        routeKey: 'route-missing',
        componentId: 'comp-1',
      });

      expect(result).toBe(state);
    });

    it('returns same state reference for non-existent component ID', () => {
      const state: CompositionRegistry = new Map([
        ['route-1', new Map([['comp-1', { title: 'Exists' }]])],
      ]);

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
      const state: CompositionRegistry = new Map([
        ['route-1', new Map([['comp-1', { title: 'Unchanged' }]])],
      ]);

      const result = registryReducer(state, {
        type: 'unknown' as any,
        routeKey: 'route-1',
        componentId: 'comp-1',
      });

      expect(result).toBe(state);
    });
  });
});
