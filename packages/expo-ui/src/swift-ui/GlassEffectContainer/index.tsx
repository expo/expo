import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type GlassEffectContainerProps = {
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
} & CommonViewModifierProps;

type NativeGlassEffectContainerProps = GlassEffectContainerProps;

const GlassEffectContainerNativeView: React.ComponentType<NativeGlassEffectContainerProps> =
  requireNativeView('ExpoUI', 'GlassEffectContainerView');

export function GlassEffectContainer(props: GlassEffectContainerProps) {
  const eventProp = props.modifiers ? createViewModifierEventListener(props.modifiers) : undefined;
  return <GlassEffectContainerNativeView {...props} {...eventProp} />;
}
