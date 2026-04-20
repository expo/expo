/* eslint-disable no-var */

import * as swiftUI from '@expo/ui/swift-ui';
import * as modifiers from '@expo/ui/swift-ui/modifiers';

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

  function findAndCallOnPress(node?: Dictionary): Dictionary | undefined {
    const props = node?.props as {
      onButtonPress?: () => Dictionary;
      target?: string;
      children?: unknown;
    };
    if (props?.onButtonPress && props?.target === target) {
      return props.onButtonPress();
    }

    for (const child of React.Children.toArray(props?.children)) {
      const result = findAndCallOnPress(child as Dictionary);
      if (result) {
        return result;
      }
    }
  }

  const node = globalThis.__expoWidgetRender(props, renderEnvironment);
  return findAndCallOnPress(node as Dictionary);
};

Object.assign(globalThis, {
  ...swiftUI,
  ...modifiers,
  ...jsxRuntime,
  ...React,
  ...ReactNative,
  React,
  __expoWidgetRender,
  __expoWidgetHandlePress,
});
