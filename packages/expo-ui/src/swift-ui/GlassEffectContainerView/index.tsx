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

/**
 * @hidden
 */
export type NativeGlassEffectContainerProps = GlassEffectContainerProps;

const GlassEffectContainerNativeView: React.ComponentType<NativeGlassEffectContainerProps> =
  requireNativeView('ExpoUI', 'GlassEffectContainerView');

function transformGroupProps(props: GlassEffectContainerProps): NativeGlassEffectContainerProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

export function GlassEffectContainer(props: GlassEffectContainerProps) {
  return <GlassEffectContainerNativeView {...transformGroupProps(props)} />;
}
