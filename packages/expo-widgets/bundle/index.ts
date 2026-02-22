/* eslint-disable no-var */

import * as swiftUI from '@expo/ui/swift-ui';
import * as modifiers from '@expo/ui/swift-ui/modifiers';

import * as jsxRuntime from './jsx-runtime-stub';
import * as React from './react-stub';

type WidgetProps = Record<string, unknown>;
type WidgetNode = { props?: WidgetProps };

declare global {
  var __expoWidgetLayout: (props: WidgetProps) => WidgetNode;
  var __expoWidgetProps: WidgetProps | undefined;
  var __expoWidgetRender: (timestamp: number, family?: string) => WidgetProps;
  var __expoWidgetHandlePress: (
    timestamp: number,
    family: string | undefined,
    target: string | undefined
  ) => WidgetProps | undefined;
}

const __expoWidgetRender = function (timestamp: number, family?: string) {
  if (family) {
    return globalThis.__expoWidgetLayout(
      Object.assign({ date: new Date(timestamp), family }, globalThis.__expoWidgetProps || {})
    );
  }
  return globalThis.__expoWidgetLayout(
    Object.assign({ date: new Date(timestamp) }, globalThis.__expoWidgetProps || {})
  );
};

const __expoWidgetHandlePress = function (
  timestamp: number,
  family: string | undefined,
  target: string | undefined
) {
  function findAndCallOnPress(node?: WidgetNode): WidgetProps | undefined {
    const props = node?.props as {
      onButtonPress?: () => WidgetProps;
      target?: string;
      children?: unknown;
    };
    if (props?.onButtonPress && props?.target === target) {
      return props.onButtonPress();
    }

    if (props?.children && Array.isArray(props.children)) {
      for (const child of props.children) {
        const result = findAndCallOnPress(child as WidgetNode);
        if (result) {
          return result;
        }
      }
    }
  }

  const node = globalThis.__expoWidgetRender(timestamp, family);
  return findAndCallOnPress(node as WidgetNode);
};

Object.assign(globalThis, {
  ...swiftUI,
  ...modifiers,
  ...jsxRuntime,
  ...React,
  __expoWidgetRender,
  __expoWidgetHandlePress,
});
