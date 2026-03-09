import { requireNativeView } from 'expo';

import {
  ContentAlignment,
  FloatingToolbarExitAlwaysScrollBehavior,
  PrimitiveBaseProps,
  transformProps,
} from '../layout-types';

export type BoxProps = {
  children?: React.ReactNode;
  /**
   * Alignment of children within the box.
   */
  contentAlignment?: ContentAlignment;
  /**
   * Scroll behavior for the floating toolbar exit.
   */
  floatingToolbarExitAlwaysScrollBehavior?: FloatingToolbarExitAlwaysScrollBehavior;
} & PrimitiveBaseProps;

const BoxNativeView: React.ComponentType<BoxProps> = requireNativeView('ExpoUI', 'BoxView');

export function Box(props: BoxProps) {
  return <BoxNativeView {...transformProps(props)} />;
}
