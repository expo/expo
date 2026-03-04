import { requireNativeView } from 'expo';

import { PrimitiveBaseProps, transformProps } from '../layout-types';

// TODO(@ubax): Add configurable enter/exit transition API

export type AnimatedVisibilityProps = {
  children?: React.ReactNode;
  /**
   * Whether the content is visible. When changed, the content will animate in or out
   * using the default Compose transitions (fadeIn + expandIn / fadeOut + shrinkOut).
   */
  visible: boolean;
} & PrimitiveBaseProps;

const AnimatedVisibilityNativeView: React.ComponentType<AnimatedVisibilityProps> =
  requireNativeView('ExpoUI', 'AnimatedVisibilityView');

export function AnimatedVisibility(props: AnimatedVisibilityProps) {
  return <AnimatedVisibilityNativeView {...transformProps(props)} />;
}
