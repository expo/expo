Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

// Backing store + spies shared with the mocked native ObservableState. The
// `mock` prefix is required for jest to allow referencing them inside the
// hoisted `jest.mock` factory below.
const mockStore: { value?: unknown } = {};
const mockGetValue = jest.fn(() => mockStore.value);
const mockSetValue = jest.fn(({ value }: { value: unknown }) => {
  mockStore.value = value;
});

jest.mock('expo', () => {
  class MockObservableState {
    constructor({ value }: { value: unknown }) {
      mockSetValue({ value });
    }
    getValue() {
      return mockGetValue();
    }
    setValue(v: { value: unknown }) {
      return mockSetValue(v);
    }
    setOnChange() {}
  }
  return {
    requireNativeModule: () => ({
      ObservableState: MockObservableState,
      WorkletCallback: class {},
    }),
  };
});

// Override only `useReleasingSharedObject` to invoke the factory synchronously
// so the hook can run outside a renderer; keep the rest of the real module so
// the native jest projects' setup (which extends base classes from it) loads.
jest.mock('expo-modules-core', () => ({
  ...jest.requireActual('expo-modules-core'),
  useReleasingSharedObject: (factory: () => unknown) => factory(),
}));

// Stub `useRef` so the hook is callable as a plain function in the test.
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: (initial: unknown) => ({ current: initial }),
}));

const { useNativeState } = require('../useNativeState');

describe('useNativeState get/set (React Compiler-friendly accessors)', () => {
  beforeEach(() => {
    mockGetValue.mockClear();
    mockSetValue.mockClear();
    delete mockStore.value;
  });

  it('get() reads through the native getValue', () => {
    const state = useNativeState('hello');
    expect(state.get()).toBe('hello');
    expect(mockGetValue).toHaveBeenCalled();
  });

  it('set(value) writes through the native setValue', () => {
    const state = useNativeState('');
    state.set('world');
    expect(mockSetValue).toHaveBeenLastCalledWith({ value: 'world' });
    expect(state.get()).toBe('world');
  });

  it('keeps `.value` working as before', () => {
    const state = useNativeState('a');
    expect(state.value).toBe('a');
    state.value = 'b';
    expect(state.value).toBe('b');
  });
});
