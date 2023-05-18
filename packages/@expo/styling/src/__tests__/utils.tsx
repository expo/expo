import React, {
  ComponentType,
  ForwardRefExoticComponent,
  RefAttributes,
} from "react";
import { View, ViewProps } from "react-native";

import {
  CssToReactNativeRuntimeOptions,
  cssToReactNativeRuntime,
} from "../css-to-rn";
import { defaultCSSInterop } from "../runtime/native/css-interop";
import { StyleSheet } from "../runtime/native/stylesheet";

export function registerCSS(
  css: string,
  options?: CssToReactNativeRuntimeOptions
) {
  StyleSheet.register(cssToReactNativeRuntime(Buffer.from(css), options));
}

type MockComponentProps = ViewProps & { className?: string };

export function createMockComponent(
  Component: React.ComponentType<any> = View
): ForwardRefExoticComponent<
  MockComponentProps & RefAttributes<MockComponentProps>
> {
  const component = Object.assign(
    jest.fn((props, ref) => <Component ref={ref} {...props} />)
  );
  const b = React.forwardRef(component);

  const componentWithRef = React.forwardRef<MockComponentProps>(
    (props, ref) => {
      return defaultCSSInterop(
        (ComponentType: ComponentType<any>, props: object, key: string) => {
          return <ComponentType ref={ref} {...props} key={key} />;
        },
        b,
        props,
        "key",
        true
      );
    }
  );

  Object.assign(componentWithRef, {
    component,
  });

  return componentWithRef;
}
