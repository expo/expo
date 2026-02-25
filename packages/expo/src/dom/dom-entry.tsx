// Entry file for a DOM Component.
import '@expo/metro-runtime';

import React from 'react';

import { JSONValue } from './dom.types';
import { addEventListener, getActionsObject } from './marshal';
import registerRootComponent from '../launch/registerRootComponent';

export interface MarshalledProps {
  names: string[];
  props: Record<string, JSONValue>;
  [key: string]: undefined | JSONValue;
}

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
  if (typeof window.$$EXPO_DOM_HOST_OS === 'undefined') {
    throw new Error(
      'Top OS ($$EXPO_DOM_HOST_OS) is not defined. This is a bug in the DOM Component runtime.'
    );
  }
  process.env.EXPO_DOM_HOST_OS = window.$$EXPO_DOM_HOST_OS;

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
      return marshalledProps.names.reduce((acc: Record<string, any>, key: string) => {
        acc[key] = ACTIONS[key];
        return acc;
      }, {});
    }, [marshalledProps.names]);

    return <AppModule {...props} {...(marshalledProps.props || {})} {...proxyActions} />;
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      require('@expo/log-box/lib').setupLogBox();
    }

    React.startTransition(() => {
      registerRootComponent(DOMComponentRoot);
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
