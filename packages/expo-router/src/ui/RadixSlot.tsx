/**
 * Copyright (c) 2022 WorkOS
 *
 * This source code is licensed under the MIT license.
 *
 * https://www.npmjs.com/package/@radix-ui/react-slot/v/1.2.4
 * https://www.npmjs.com/package/@radix-ui/react-compose-refs/v/1.1.2
 */

import { Children, Fragment, cloneElement, isValidElement, use } from 'react';
import type { HTMLAttributes, ReactNode, Ref, RefCallback } from 'react';

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

type ChildProps = Record<string, unknown> & { ref?: Ref<HTMLElement> };

function isLazyChild(child: ReactNode): child is ReactNode & { _payload: PromiseLike<ReactNode> } {
  return (
    typeof child === 'object' &&
    child !== null &&
    '$$typeof' in child &&
    child.$$typeof === Symbol.for('react.lazy') &&
    '_payload' in child &&
    typeof child._payload === 'object' &&
    child._payload !== null &&
    'then' in child._payload
  );
}

export function Slot({ children, ref, ...slotProps }: SlotProps & { ref?: Ref<HTMLElement> }) {
  const child = isLazyChild(children) ? use(children._payload) : children;

  if (isValidElement<ChildProps>(child)) {
    const props = mergeProps(slotProps, child.props);
    if (child.type !== Fragment) {
      props.ref = ref ? composeRefs(ref, child.props.ref) : child.props.ref;
    }
    return cloneElement(child, props);
  }

  return Children.count(child) > 1 ? Children.only(null) : null;
}

function mergeProps(slotProps: Record<string, unknown>, childProps: ChildProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotValue = slotProps[propName];
    const childValue = childProps[propName];

    if (/^on[A-Z]/.test(propName)) {
      if (typeof slotValue === 'function' && typeof childValue === 'function') {
        overrideProps[propName] = (...args: unknown[]) => {
          const result = childValue(...args);
          slotValue(...args);
          return result;
        };
      } else if (slotValue) {
        overrideProps[propName] = slotValue;
      }
    } else if (propName === 'style') {
      // Props are `unknown`, so cast to spread. Spreading an absent style adds nothing.
      overrideProps.style = { ...(slotValue as object), ...(childValue as object) };
    } else if (propName === 'className') {
      overrideProps.className = [slotValue, childValue].filter(Boolean).join(' ');
    }
  }
  return { ...slotProps, ...overrideProps };
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    return ref(value);
  }
  if (ref != null) {
    ref.current = value;
  }
}

function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => setRef(ref, node));
    if (cleanups.some((cleanup) => typeof cleanup === 'function')) {
      return () => {
        cleanups.forEach((cleanup, index) => {
          if (typeof cleanup === 'function') {
            cleanup();
          } else {
            setRef(refs[index], null);
          }
        });
      };
    }
    return undefined;
  };
}
