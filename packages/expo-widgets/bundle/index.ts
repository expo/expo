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
  var __expoWidgetEnvironment: Dictionary | undefined;
}

/**
 * Resolve components at the render boundary so parents can inspect their JSX children.
 * Identity is the native type plus the outermost explicit key, or flattened sibling index.
 * Keys must be unique among flattened siblings; dynamic lists should provide explicit keys.
 */
function normalizeWidgetTree(node: unknown, position: string | number = 0): unknown {
  let key: string | null = null;
  while (React.isValidElement(node) && typeof node.type === 'function') {
    key ??= node.key;
    const rendered = node.type(node.props);
    node = Array.isArray(rendered)
      ? jsxRuntime.jsx(React.Fragment, { children: rendered })
      : rendered;
  }

  if (Array.isArray(node)) {
    return node.flat(Infinity).map((child, index) => normalizeWidgetTree(child, index));
  }
  if (React.isValidElement(node)) {
    const props = { ...node.props };
    if ('children' in props) {
      props.children = normalizeWidgetTree(props.children);
    }
    return {
      ...node,
      props,
      __expoWidgetIdentity: JSON.stringify([node.type, key ?? node.key ?? position]),
    };
  }
  if (node && typeof node === 'object') {
    // Live Activity layouts return a map of section names to roots.
    return Object.fromEntries(
      Object.entries(node).map(([section, child]) => [section, normalizeWidgetTree(child, section)])
    );
  }
  return node;
}

const __expoWidgetRender = function (props: Dictionary, environment: Dictionary) {
  // `materialColors` backs the native expo-ui module stub and stays out of the layout environment.
  const { timestamp, materialColors, ...rest } = environment;
  const decoratedEnvironment: Dictionary = { ...rest };
  if (timestamp) {
    decoratedEnvironment.date = new Date(timestamp as number);
  }
  globalThis.__expoWidgetEnvironment = { ...decoratedEnvironment, materialColors };

  return decorateInteractiveTargets(
    normalizeWidgetTree(globalThis.__expoWidgetLayout(props, decoratedEnvironment))
  );
};

const __expoWidgetHandlePress = function (
  props: Dictionary,
  environment: Dictionary & { target?: string }
) {
  const { target, ...renderEnvironment } = environment;

  function findAndCallOnPress(node?: Dictionary): Dictionary | undefined {
    const props = node?.props as {
      onButtonPress?: () => Dictionary;
      onButtonPressed?: () => Dictionary;
      target?: string;
      children?: unknown;
    };
    // TODO(@jakex7): on iOS it's named `onButtonPress` while on Android it's named `onButtonPressed`. We should unify this in the future.
    const onPress = props?.onButtonPress ?? props?.onButtonPressed;
    if (onPress && props?.target === target) {
      return onPress();
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
  ...uiGlobals,
  ...jsxRuntime,
  ...React,
  ...ReactNative,
  React,
  __expoWidgetRender,
  __expoWidgetHandlePress,
});
