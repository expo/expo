// Entry file for a DOM Component.
import '@expo/metro-runtime';

import { withErrorOverlay } from '@expo/metro-runtime/error-overlay';
import React from 'react';

import { JSONValue } from './dom.types';
import { addEventListener, getActionsObject } from './marshal';
import registerRootComponent from '../launch/registerRootComponent';

interface MarshalledProps {
  name: string[];
  props: Record<string, JSONValue>;
  [key: string]: undefined | JSONValue;
}

interface WindowType {
  $$EXPO_INITIAL_PROPS?: MarshalledProps;
}

declare let window: WindowType;

const ACTIONS = getActionsObject!();

function isBaseObject(obj: any) {
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return false;
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto === null) {
    return true;
  }
  return proto === Object.prototype;
}

function isErrorShaped(error: any): error is Error {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.name === 'string' &&
    typeof error.message === 'string'
  );
}

/**
 * After we throw this error, any number of tools could handle it.
 * This check ensures the error is always in a reasonable state before surfacing it to the runtime.
 */
function convertError(error: any) {
  if (isErrorShaped(error)) {
    return error;
  }

  if (process.env.NODE_ENV === 'development') {
    if (error == null) {
      return new Error('A null/undefined error was thrown.');
    }
  }

  if (isBaseObject(error)) {
    return new Error(JSON.stringify(error));
  }

  return new Error(String(error));
}

export function registerDOMComponent(AppModule: any) {
  function DOMComponentRoot(props: Record<string, unknown>) {
    // Props listeners
    const [marshalledProps, setProps] = React.useState(() => {
      if (typeof window.$$EXPO_INITIAL_PROPS === 'undefined') {
        throw new Error(
          'Initial props are not defined. This is a bug in the DOM Component runtime.'
        );
      }
      return window.$$EXPO_INITIAL_PROPS;
    });

    React.useEffect(() => {
      const remove = addEventListener!((msg) => {
        if (msg.type === '$$props') {
          setProps(msg.data as MarshalledProps);
        }
      });
      return () => {
        remove();
      };
    }, [setProps]);

    const proxyActions = React.useMemo(() => {
      if (!marshalledProps.names) return {};
      // Create a named map { [name: string]: ProxyFunction }
      // TODO(@kitten): Unclear how this is typed or shaped
      return Object.fromEntries(
        (marshalledProps.names as string[]).map((key: string) => {
          return [key, ACTIONS[key]];
        })
      );
    }, [marshalledProps.names]);

    return <AppModule {...props} {...(marshalledProps.props || {})} {...proxyActions} />;
  }

  try {
    React.startTransition(() => {
      if (process.env.NODE_ENV !== 'production') {
        registerRootComponent(withErrorOverlay(DOMComponentRoot));
      } else {
        registerRootComponent(DOMComponentRoot);
      }
    });
  } catch (e) {
    const error = convertError(e);
    // Prevent the app from throwing confusing:
    //  ERROR  Invariant Violation: "main" has not been registered. This can happen if:
    // * Metro (the local dev server) is run from the wrong folder. Check if Metro is running, stop it and restart it in the current project.
    // * A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.
    registerRootComponent(() => React.createElement('div'));

    console.error(error);
    console.error(`A runtime error has occurred while rendering the root component.`);

    // Give React a tick to render before throwing.
    setTimeout(() => {
      throw error;
    });
  }
}
