import { requireOptionalNative } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface GlassEffectContainerProps extends CommonViewModifierProps {
  /**
   * The children of the `GlassEffectContainer` component.
   * These should be views with `.glassEffect()` modifiers applied.
   */
  children: React.ReactNode;
  /**
   * The spacing between glass elements in the container.
   * This controls how close elements need to be to start blending together.
   */
  spacing?: number;
}

type NativeGlassEffectContainerProps = GlassEffectContainerProps;

// Only iOS has native views in `expo.packages`. Android also loads this file
// (through `@expo/ui/swift-ui`), and there `requireNative` would throw.
const GlassEffectContainerNativeView: React.ComponentType<NativeGlassEffectContainerProps> =
  requireOptionalNative('@expo/ui')?.GlassEffectContainerView;

export function GlassEffectContainer(props: GlassEffectContainerProps) {
  const eventProp = props.modifiers ? createViewModifierEventListener(props.modifiers) : undefined;
  return <GlassEffectContainerNativeView {...props} {...eventProp} />;
}
