// React Native ships no types for these `Libraries/*` modules. They are the
// same modules that `Libraries/Text/Text.js` and `TextNativeComponent.js` use.

declare module 'react-native/Libraries/NativeComponent/ViewConfig' {
  export function createViewConfig(partialViewConfig: object): object;
}

declare module 'react-native/Libraries/Renderer/shims/createReactNativeComponentClass' {
  export default function createReactNativeComponentClass(
    name: string,
    callback: () => object
  ): string;
}

declare module 'react-native/Libraries/ReactNative/RendererProxy' {
  export function dispatchCommand(handle: unknown, command: string, args: readonly unknown[]): void;
}

declare module 'react-native/Libraries/Text/TextNativeComponent' {
  import type { HostComponent, TextProps } from 'react-native';

  export const NativeVirtualText: HostComponent<TextProps>;
}

declare module 'react-native/Libraries/Pressability/PressabilityDebug' {
  export function isEnabled(): boolean;
}

declare module 'react-native/Libraries/Pressability/usePressability' {
  import type { GestureResponderEvent, Insets } from 'react-native';

  export type PressabilityConfig = Readonly<{
    disabled?: boolean | null;
    pressRectOffset?: Insets | null;
    onLongPress?: ((event: GestureResponderEvent) => unknown) | null;
    onPress?: ((event: GestureResponderEvent) => unknown) | null;
    onPressIn?: ((event: GestureResponderEvent) => unknown) | null;
    onPressOut?: ((event: GestureResponderEvent) => unknown) | null;
  }>;

  export type EventHandlers = Readonly<{
    onClick: (event: GestureResponderEvent) => void;
    onResponderGrant: (event: GestureResponderEvent) => void;
    onResponderMove: (event: GestureResponderEvent) => void;
    onResponderRelease: (event: GestureResponderEvent) => void;
    onResponderTerminate: (event: GestureResponderEvent) => void;
    onResponderTerminationRequest: () => boolean;
    onStartShouldSetResponder: () => boolean;
  }>;

  export default function usePressability(config: PressabilityConfig | null): EventHandlers | null;
}
