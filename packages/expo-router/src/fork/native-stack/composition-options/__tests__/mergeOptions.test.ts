import type { ParamListBase, StackNavigationState } from '@react-navigation/native';

import type { NativeStackDescriptorMap } from '../../descriptors-context';
import { mergeOptions, type MergeOptionsCache } from '../mergeOptions';
import type { CompositionRegistry } from '../types';

/** The inner Map type of CompositionRegistry: Map<componentId, options> */
type RouteOptionsMap = CompositionRegistry extends Map<string, infer V> ? V : never;

function createMockDescriptor(options: Record<string, any> = {}): NativeStackDescriptorMap[string] {
  return {
    options,
    // Minimal mocks for other descriptor fields
    render: jest.fn(),
    navigation: {} as any,
    route: {} as any,
  };
}

function createMockState(
  overrides: Partial<StackNavigationState<ParamListBase>> = {}
): StackNavigationState<ParamListBase> {
  return {
    type: 'stack',
    key: 'stack-key',
    index: 0,
    routeNames: ['index'],
    routes: [{ key: 'route-1', name: 'index', params: undefined }],
    preloadedRoutes: [],
    stale: false,
    ...overrides,
  };
}

describe('mergeOptions', () => {
  it('returns descriptors unchanged when registry is empty', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Original' }),
    };
    const registry: CompositionRegistry = new Map();
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state, new Map());

    expect(result['route-1'].options).toEqual({ title: 'Original' });
    // Should return same reference when no composition options
    expect(result['route-1']).toBe(descriptors['route-1']);
  });

  it('merges single component options', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Original', headerShown: true }),
    };
    const registry: CompositionRegistry = new Map([
      ['route-1', new Map([['comp-1', { title: 'Composed Title' }]])],
    ]);
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state, new Map());

    expect(result['route-1'].options).toEqual({
      title: 'Composed Title',
      headerShown: true,
    });
    expect(result['route-1']).not.toBe(descriptors['route-1']);
  });

  it('composition options override descriptor options', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Static', headerShown: false }),
    };
    const registry: CompositionRegistry = new Map([
      ['route-1', new Map([['comp-1', { title: 'Dynamic', headerShown: true }]])],
    ]);
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state, new Map());

    expect(result['route-1'].options.title).toBe('Dynamic');
    expect(result['route-1'].options.headerShown).toBe(true);
    expect(result['route-1']).not.toBe(descriptors['route-1']);
  });

  it('multiple components: later insertions override earlier ones', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Base' }),
    };
    const routeMap = new Map<string, Partial<any>>();
    routeMap.set('title-comp', { title: 'First Title' });
    routeMap.set('header-comp', { headerShown: false });
    routeMap.set('title-comp-2', { title: 'Second Title' });
    const registry: CompositionRegistry = new Map([['route-1', routeMap]]);
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state, new Map());

    // Last title component wins
    expect(result['route-1'].options.title).toBe('Second Title');
    expect(result['route-1'].options.headerShown).toBe(false);
    expect(result['route-1']).not.toBe(descriptors['route-1']);
  });

  it('skips composition layer for preloaded unfocused route', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Focused' }),
      'route-preloaded': createMockDescriptor({ title: 'Preloaded Static' }),
    };
    const registry: CompositionRegistry = new Map([
      ['route-1', new Map([['comp-1', { title: 'Composed Focused' }]])],
      ['route-preloaded', new Map([['comp-2', { title: 'Should Not Apply' }]])],
    ]);
    const state = createMockState({
      index: 0,
      routes: [{ key: 'route-1', name: 'index', params: undefined }],
      preloadedRoutes: [{ key: 'route-preloaded', name: 'detail', params: undefined }],
    });

    const result = mergeOptions(descriptors, registry, state, new Map());

    // Focused route gets composition options
    expect(result['route-1'].options.title).toBe('Composed Focused');
    // Preloaded unfocused route keeps original options
    expect(result['route-preloaded'].options.title).toBe('Preloaded Static');
    expect(result['route-preloaded']).toBe(descriptors['route-preloaded']);
  });

  it('applies composition layer for preloaded AND focused route', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Original' }),
      'route-preloaded': createMockDescriptor({ title: 'Preloaded Static' }),
    };
    const registry: CompositionRegistry = new Map([
      ['route-preloaded', new Map([['comp-1', { title: 'Preloaded Composed' }]])],
    ]);
    // Preloaded route that is also focused (e.g., during preview transition)
    const state = createMockState({
      index: 1,
      routes: [
        { key: 'route-1', name: 'index', params: undefined },
        { key: 'route-preloaded', name: 'detail', params: undefined },
      ],
      preloadedRoutes: [{ key: 'route-preloaded', name: 'detail', params: undefined }],
    });

    const result = mergeOptions(descriptors, registry, state, new Map());

    expect(result['route-preloaded'].options.title).toBe('Preloaded Composed');
  });

  it('does not mutate input descriptors', () => {
    const originalOptions = { title: 'Original', headerShown: true };
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor(originalOptions),
    };
    const registry: CompositionRegistry = new Map([
      ['route-1', new Map([['comp-1', { title: 'Modified' }]])],
    ]);
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state, new Map());

    // Original descriptor options unchanged
    expect(descriptors['route-1'].options.title).toBe('Original');
    // New result has merged options
    expect(result['route-1'].options.title).toBe('Modified');
    // Different object reference
    expect(result['route-1']).not.toBe(descriptors['route-1']);
    expect(result['route-1'].options).not.toBe(descriptors['route-1'].options);
  });

  it('handles routes with no matching registry entries', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'One' }),
      'route-2': createMockDescriptor({ title: 'Two' }),
    };
    const registry: CompositionRegistry = new Map([
      ['route-1', new Map([['comp-1', { title: 'Modified One' }]])],
    ]);
    const state = createMockState({
      index: 1,
      routes: [
        { key: 'route-1', name: 'index', params: undefined },
        { key: 'route-2', name: 'detail', params: undefined },
      ],
    });

    const result = mergeOptions(descriptors, registry, state, new Map());

    expect(result['route-1'].options.title).toBe('Modified One');
    expect(result['route-2'].options.title).toBe('Two');
    expect(result['route-2']).toBe(descriptors['route-2']);
  });

  it('handles empty route map (all components unregistered)', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Original' }),
    };
    const registry: CompositionRegistry = new Map([['route-1', new Map()]]);
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state, new Map());

    expect(result['route-1'].options).toEqual({ title: 'Original' });
    expect(result['route-1']).toBe(descriptors['route-1']);
  });

  it('preserves non-options descriptor fields', () => {
    const mockRender = jest.fn();
    const mockNavigation = { navigate: jest.fn() } as any;
    const mockRoute = { key: 'route-1', name: 'index' } as any;
    const descriptor: NativeStackDescriptorMap = {
      'route-1': {
        options: { title: 'Original' },
        render: mockRender,
        navigation: mockNavigation,
        route: mockRoute,
      },
    };
    const registry: CompositionRegistry = new Map([
      ['route-1', new Map([['comp-1', { title: 'Modified' }]])],
    ]);
    const state = createMockState();

    const result = mergeOptions(descriptor, registry, state, new Map());

    expect(result['route-1'].render).toBe(mockRender);
    expect(result['route-1'].navigation).toBe(mockNavigation);
    expect(result['route-1'].route).toBe(mockRoute);
  });
});

describe('mergeOptions with cache', () => {
  it('reuses cached result when descriptor and routeOptions refs are unchanged', () => {
    const descriptor = createMockDescriptor({ title: 'Original' });
    const descriptors: NativeStackDescriptorMap = { 'route-1': descriptor };
    const routeMap = new Map([['comp-1', { title: 'Composed' }]]) as RouteOptionsMap;
    const registry: CompositionRegistry = new Map([['route-1', routeMap]]);
    const state = createMockState();
    const cache: MergeOptionsCache = new Map();

    const result1 = mergeOptions(descriptors, registry, state, cache);
    const result2 = mergeOptions(descriptors, registry, state, cache);

    expect(result1['route-1']).toBe(result2['route-1']);
    expect(result2['route-1'].options.title).toBe('Composed');
  });

  it('recomputes when routeOptions reference changes', () => {
    const descriptor = createMockDescriptor({ title: 'Original' });
    const descriptors: NativeStackDescriptorMap = { 'route-1': descriptor };
    const state = createMockState();
    const cache: MergeOptionsCache = new Map();

    const routeMap1 = new Map([['comp-1', { title: 'First' }]]) as RouteOptionsMap;
    const registry1: CompositionRegistry = new Map([['route-1', routeMap1]]);
    const result1 = mergeOptions(descriptors, registry1, state, cache);

    const routeMap2 = new Map([['comp-1', { title: 'Second' }]]) as RouteOptionsMap;
    const registry2: CompositionRegistry = new Map([['route-1', routeMap2]]);
    const result2 = mergeOptions(descriptors, registry2, state, cache);

    expect(result1['route-1']).not.toBe(result2['route-1']);
    expect(result1['route-1'].options.title).toBe('First');
    expect(result2['route-1'].options.title).toBe('Second');
  });

  it('recomputes when descriptor reference changes', () => {
    const state = createMockState();
    const cache: MergeOptionsCache = new Map();
    const routeMap = new Map([['comp-1', { title: 'Composed' }]]) as RouteOptionsMap;
    const registry: CompositionRegistry = new Map([['route-1', routeMap]]);

    const descriptor1 = createMockDescriptor({ title: 'V1' });
    const result1 = mergeOptions({ 'route-1': descriptor1 }, registry, state, cache);

    const descriptor2 = createMockDescriptor({ title: 'V2' });
    const result2 = mergeOptions({ 'route-1': descriptor2 }, registry, state, cache);

    expect(result1['route-1']).not.toBe(result2['route-1']);
  });

  it('caches independently per route — changing one does not invalidate the other', () => {
    const descriptor1 = createMockDescriptor({ title: 'Route 1' });
    const descriptor2 = createMockDescriptor({ title: 'Route 2' });
    const routeMap1 = new Map([['comp-1', { title: 'Composed 1' }]]) as RouteOptionsMap;
    const routeMap2 = new Map([['comp-2', { title: 'Composed 2' }]]) as RouteOptionsMap;
    const state = createMockState({
      index: 1,
      routes: [
        { key: 'route-1', name: 'index', params: undefined },
        { key: 'route-2', name: 'detail', params: undefined },
      ],
    });
    const cache: MergeOptionsCache = new Map();

    const registry: CompositionRegistry = new Map([
      ['route-1', routeMap1],
      ['route-2', routeMap2],
    ]);
    const descriptors: NativeStackDescriptorMap = {
      'route-1': descriptor1,
      'route-2': descriptor2,
    };

    const result1 = mergeOptions(descriptors, registry, state, cache);

    // Change only route-2's routeOptions
    const routeMap2b = new Map([['comp-2', { title: 'Composed 2 Updated' }]]) as RouteOptionsMap;
    const registry2: CompositionRegistry = new Map([
      ['route-1', routeMap1],
      ['route-2', routeMap2b],
    ]);

    const result2 = mergeOptions(descriptors, registry2, state, cache);

    // route-1 should be cached (same reference)
    expect(result2['route-1']).toBe(result1['route-1']);
    // route-2 should be recomputed
    expect(result2['route-2']).not.toBe(result1['route-2']);
    expect(result2['route-2'].options.title).toBe('Composed 2 Updated');
  });

  it('prunes stale cache entries when routes are removed', () => {
    const state = createMockState();
    const cache: MergeOptionsCache = new Map();

    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'One' }),
      'route-2': createMockDescriptor({ title: 'Two' }),
    };
    const registry: CompositionRegistry = new Map();

    mergeOptions(descriptors, registry, state, cache);
    expect(cache.has('route-1')).toBe(true);
    expect(cache.has('route-2')).toBe(true);

    // Remove route-2
    const descriptors2: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'One' }),
    };
    mergeOptions(descriptors2, registry, state, cache);

    expect(cache.has('route-1')).toBe(true);
    expect(cache.has('route-2')).toBe(false);
  });

  it('invalidates cache when preloaded route becomes focused', () => {
    const descriptor = createMockDescriptor({ title: 'Original' });
    const routeMap = new Map([['comp-1', { title: 'Composed' }]]) as RouteOptionsMap;
    const registry: CompositionRegistry = new Map([['route-1', routeMap]]);
    const cache: MergeOptionsCache = new Map();

    // route-1 is preloaded and NOT focused → skip composition
    const state1 = createMockState({
      index: 0,
      routes: [{ key: 'route-0', name: 'index', params: undefined }],
      preloadedRoutes: [{ key: 'route-1', name: 'detail', params: undefined }],
    });
    const descriptors: NativeStackDescriptorMap = {
      'route-0': createMockDescriptor({}),
      'route-1': descriptor,
    };
    const result1 = mergeOptions(descriptors, registry, state1, cache);
    expect(result1['route-1']).toBe(descriptor);

    // route-1 becomes focused (same descriptor/registry refs)
    const state2 = createMockState({
      index: 1,
      routes: [
        { key: 'route-0', name: 'index', params: undefined },
        { key: 'route-1', name: 'detail', params: undefined },
      ],
      preloadedRoutes: [],
    });
    const result2 = mergeOptions(descriptors, registry, state2, cache);

    expect(result2['route-1']).not.toBe(descriptor);
    expect(result2['route-1'].options.title).toBe('Composed');
  });

  it('transitions correctly from pass-through to merged', () => {
    const descriptor = createMockDescriptor({ title: 'Original' });
    const descriptors: NativeStackDescriptorMap = { 'route-1': descriptor };
    const state = createMockState();
    const cache: MergeOptionsCache = new Map();

    // First call: no composition options (pass-through)
    const registry1: CompositionRegistry = new Map();
    const result1 = mergeOptions(descriptors, registry1, state, cache);
    expect(result1['route-1']).toBe(descriptor);

    // Second call: composition options added
    const routeMap = new Map([['comp-1', { title: 'Composed' }]]) as RouteOptionsMap;
    const registry2: CompositionRegistry = new Map([['route-1', routeMap]]);
    const result2 = mergeOptions(descriptors, registry2, state, cache);

    expect(result2['route-1']).not.toBe(descriptor);
    expect(result2['route-1'].options.title).toBe('Composed');
  });
});
