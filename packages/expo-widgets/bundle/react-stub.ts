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

// Each widget render is a fresh mount, so there is nothing to memoize.
export const memo = (component: any, _arePropsEqual?: any) => component;
export const forwardRef = (render: any) => (props: any) => {
  const { ref = null, ...rest } = props;
  return render(rest, ref);
};
export const createRef = (): any => ({ current: null });
export function createElement(type: any, config?: any, ...children: any[]) {
  const { key, ...props } = config ?? {};
  if (children.length > 0) {
    props.children = children.length === 1 ? children[0] : children;
  }
  return { type, key: key === undefined ? null : String(key), props };
}
export function cloneElement(element: any, config?: any, ...children: any[]) {
  const cloned = createElement(element.type, { ...element.props, ...config }, ...children);
  cloned.key = config?.key === undefined ? element.key : cloned.key;
  return cloned;
}

const noop = (..._args: any[]) => {};
export const createContext = (defaultValue: any) => ({
  Provider: 'react.provider',
  Consumer: 'react.consumer',
  _currentValue: defaultValue,
});
export function useContext(context: any) {
  return context._currentValue;
}

export function useState(initialState?: any) {
  return [typeof initialState === 'function' ? initialState() : initialState, noop];
}

export function useReducer(_reducer: any, initialArg: any, init?: any) {
  return [init ? init(initialArg) : initialArg, noop];
}

export const useRef = (initialValue: any) => ({ current: initialValue });
export const useMemo = (factory: any, _deps?: any) => factory();
export const useCallback = (callback: any, _deps?: any) => callback;
export const useEffectEvent = (callback: any) => callback;

export const useEffect = noop;
export const useLayoutEffect = noop;
export const useInsertionEffect = noop;
export const useImperativeHandle = noop;
export const useDebugValue = noop;

export const useDeferredValue = (value: any, _initialValue?: any) => value;
export const startTransition = (callback: any) => {
  callback();
};
export const useTransition = (): any[] => [false, startTransition];
let nextId = 0;
export const useId = () => `:expo-widget-${nextId++}:`;

export const useSyncExternalStore = (_subscribe: any, getSnapshot: any, getServerSnapshot?: any) =>
  (getServerSnapshot ?? getSnapshot)();

export const useOptimistic = (state: any, _reducer?: any) => [state, noop];
export const useActionState = (_action: any, initialState: any, _permalink?: any) => [
  initialState,
  noop,
  false,
];

export function use(resource: any) {
  if ('_currentValue' in resource) {
    return resource._currentValue;
  }
  return resource.status === 'fulfilled' ? resource.value : undefined;
}
