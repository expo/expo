/* eslint-disable no-var */

import { decorateInteractiveTargets } from './decorator';
import * as jsxRuntime from './jsx-runtime-stub';
import * as ReactNative from './react-native-stub';
import * as React from './react-stub';
import * as uiGlobals from './ui-globals';

type Dictionary = Record<string, unknown>;

declare global {
  var __expoWidgetLayout: (props: Dictionary, environment: Dictionary) => Dictionary;
  var __expoWidgetRender: (props: Dictionary, environment: Dictionary) => Dictionary;
  var __expoWidgetHandlePress: (
    props: Dictionary,
    environment: Dictionary & { target?: string }
  ) => Dictionary | undefined;
}

const __expoWidgetRender = function (props: Dictionary, environment: Dictionary) {
  const { timestamp, ...rest } = environment;
  const decoratedEnvironment: Dictionary = { ...rest };
  if (timestamp) {
    decoratedEnvironment.date = new Date(timestamp as number);
  }

  return decorateInteractiveTargets(globalThis.__expoWidgetLayout(props, decoratedEnvironment));
};

const __expoWidgetHandlePress = function (
  props: Dictionary,
  environment: Dictionary & { target?: string }
) {
  const { target, ...renderEnvironment } = environment;

  function findAndCallOnPress(node?: unknown): Dictionary | undefined {
    if (!node || typeof node !== 'object') {
      return undefined;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        const result = findAndCallOnPress(child);
        if (result) {
          return result;
        }
      }
      return undefined;
    }

    const dictionary = node as Dictionary;
    const props = dictionary.props as
      | {
          onButtonPress?: () => Dictionary;
          onButtonPressed?: () => Dictionary;
          target?: string;
          children?: unknown;
        }
      | undefined;
    // TODO(@jakex7): on iOS it's named `onButtonPress` while on Android it's named `onButtonPressed`. We should unify this in the future.
    const onPress = props?.onButtonPress ?? props?.onButtonPressed;
    if (onPress && props?.target === target) {
      return onPress();
    }

    for (const child of React.Children.toArray(props?.children)) {
      const result = findAndCallOnPress(child);
      if (result) {
        return result;
      }
    }

    // Live Activity layouts return a map of presentation sections instead of
    // a single React root. Traverse those sections after regular children.
    for (const [key, section] of Object.entries(dictionary)) {
      if (key === 'props') {
        continue;
      }

      const result = findAndCallOnPress(section);
      if (result) {
        return result;
      }
    }
  }

  const node = globalThis.__expoWidgetRender(props, renderEnvironment);
  return findAndCallOnPress(node);
};

Object.assign(globalThis, {
  ...uiGlobals,
  ...jsxRuntime,
  ...React,
  ...ReactNative,
  React,
  __expoWidgetRender,
  __expoWidgetHandlePress,
});
