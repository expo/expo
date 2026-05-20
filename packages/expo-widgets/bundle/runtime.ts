/* eslint-disable no-var */

import { decorateInteractiveTargets } from './decorator';
import * as jsxRuntime from './jsx-runtime-stub';
import * as ReactNative from './react-native-stub';
import * as React from './react-stub';

type Dictionary = Record<string, unknown>;

declare global {
  var __expoWidgetLayout: (props: Dictionary, environment: Dictionary) => Dictionary;
  var __expoWidgetRender: (props: Dictionary, environment: Dictionary) => Dictionary;
  var __expoWidgetHandlePress: (
    props: Dictionary,
    environment: Dictionary & { target?: string }
  ) => Dictionary | undefined;
}

function __expoWidgetRender(props: Dictionary, environment: Dictionary) {
  const { timestamp, ...rest } = environment;
  const decoratedEnvironment: Dictionary = { ...rest };
  if (timestamp) {
    decoratedEnvironment.date = new Date(timestamp as number);
  }

  return decorateInteractiveTargets(globalThis.__expoWidgetLayout(props, decoratedEnvironment));
}

function __expoWidgetHandlePress(
  props: Dictionary,
  environment: Dictionary & { target?: string }
) {
  const { target, ...renderEnvironment } = environment;

  function findAndCallHandler(node?: Dictionary): Dictionary | undefined {
    const props = node?.props as {
      onButtonPress?: () => Dictionary;
      onButtonPressed?: () => Dictionary;
      target?: string;
      children?: unknown;
    };
    const handler = props?.onButtonPress ?? props?.onButtonPressed;
    if (handler && props?.target === target) {
      return handler();
    }

    for (const child of React.Children.toArray(props?.children)) {
      const result = findAndCallHandler(child as Dictionary);
      if (result) {
        return result;
      }
    }
  }

  const node = globalThis.__expoWidgetRender(props, renderEnvironment);
  return findAndCallHandler(node as Dictionary);
}

export function installWidgetRuntime(
  componentExports: Dictionary,
  modifierExports: Dictionary
) {
  Object.assign(globalThis, {
    ...componentExports,
    ...modifierExports,
    ...jsxRuntime,
    ...React,
    ...ReactNative,
    React,
    __expoWidgetRender,
    __expoWidgetHandlePress,
  });
}
