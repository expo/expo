import type { ParamListBase, StackNavigationState } from '@react-navigation/native';

import type { NativeStackDescriptorMap } from '../../descriptors-context';
import { mergeOptions } from '../mergeOptions';
import type { CompositionRegistry } from '../types';

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
    const registry: CompositionRegistry = {};
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state);

    expect(result['route-1'].options).toEqual({ title: 'Original' });
    // Should return same reference when no composition options
    expect(result['route-1']).toBe(descriptors['route-1']);
  });

  it('merges single component options', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Original', headerShown: true }),
    };
    const registry: CompositionRegistry = {
      'route-1': [{ title: 'Composed Title' }],
    };
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state);

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
    const registry: CompositionRegistry = {
      'route-1': [{ title: 'Dynamic', headerShown: true }],
    };
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state);

    expect(result['route-1'].options.title).toBe('Dynamic');
    expect(result['route-1'].options.headerShown).toBe(true);
    expect(result['route-1']).not.toBe(descriptors['route-1']);
  });

  it('multiple components: later entries override earlier ones', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Base' }),
    };
    const registry: CompositionRegistry = {
      'route-1': [{ title: 'First Title' }, { headerShown: false }, { title: 'Second Title' }],
    };
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state);

    // Last title entry wins
    expect(result['route-1'].options.title).toBe('Second Title');
    expect(result['route-1'].options.headerShown).toBe(false);
    expect(result['route-1']).not.toBe(descriptors['route-1']);
  });

  it('skips composition layer for preloaded unfocused route', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Focused' }),
      'route-preloaded': createMockDescriptor({ title: 'Preloaded Static' }),
    };
    const registry: CompositionRegistry = {
      'route-1': [{ title: 'Composed Focused' }],
      'route-preloaded': [{ title: 'Should Not Apply' }],
    };
    const state = createMockState({
      index: 0,
      routes: [{ key: 'route-1', name: 'index', params: undefined }],
      preloadedRoutes: [{ key: 'route-preloaded', name: 'detail', params: undefined }],
    });

    const result = mergeOptions(descriptors, registry, state);

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
    const registry: CompositionRegistry = {
      'route-preloaded': [{ title: 'Preloaded Composed' }],
    };
    // Preloaded route that is also focused (e.g., during preview transition)
    const state = createMockState({
      index: 1,
      routes: [
        { key: 'route-1', name: 'index', params: undefined },
        { key: 'route-preloaded', name: 'detail', params: undefined },
      ],
      preloadedRoutes: [{ key: 'route-preloaded', name: 'detail', params: undefined }],
    });

    const result = mergeOptions(descriptors, registry, state);

    expect(result['route-preloaded'].options.title).toBe('Preloaded Composed');
  });

  it('does not mutate input descriptors', () => {
    const originalOptions = { title: 'Original', headerShown: true };
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor(originalOptions),
    };
    const registry: CompositionRegistry = {
      'route-1': [{ title: 'Modified' }],
    };
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state);

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
    const registry: CompositionRegistry = {
      'route-1': [{ title: 'Modified One' }],
    };
    const state = createMockState({
      index: 1,
      routes: [
        { key: 'route-1', name: 'index', params: undefined },
        { key: 'route-2', name: 'detail', params: undefined },
      ],
    });

    const result = mergeOptions(descriptors, registry, state);

    expect(result['route-1'].options.title).toBe('Modified One');
    expect(result['route-2'].options.title).toBe('Two');
    expect(result['route-2']).toBe(descriptors['route-2']);
  });

  it('handles empty route entry (all components unregistered)', () => {
    const descriptors: NativeStackDescriptorMap = {
      'route-1': createMockDescriptor({ title: 'Original' }),
    };
    const registry: CompositionRegistry = { 'route-1': [] };
    const state = createMockState();

    const result = mergeOptions(descriptors, registry, state);

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
    const registry: CompositionRegistry = {
      'route-1': [{ title: 'Modified' }],
    };
    const state = createMockState();

    const result = mergeOptions(descriptor, registry, state);

    expect(result['route-1'].render).toBe(mockRender);
    expect(result['route-1'].navigation).toBe(mockNavigation);
    expect(result['route-1'].route).toBe(mockRoute);
  });
});
