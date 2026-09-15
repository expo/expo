import type { ReactElementNode } from './jsx-runtime-stub';

export const Fragment = 'react.fragment';

export const Children = {
  toArray(children: unknown) {
    return [children]
      .flat(Infinity)
      .filter((child) => child !== undefined && child !== null && typeof child !== 'boolean');
  },
};

export const isValidElement = (value: unknown): value is ReactElementNode => {
  return value !== null && typeof value === 'object' && 'type' in value && 'props' in value;
};

// TODO(@jakex7): Make this a proper React reconciler in the future. For now, we just need a stub to allow the widget bundle to compile with @expo/ui/jetpack-compose.
type StubContext<T> = {
  Provider: string;
  Consumer: string;
  _currentValue: T;
};

export const createContext = <T>(defaultValue: T): StubContext<T> => ({
  Provider: 'react.provider',
  Consumer: 'react.consumer',
  _currentValue: defaultValue,
});

export const useContext = <T>(context: StubContext<T>): T => context._currentValue;
