import type { ReactElement } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import type { UniversalBaseProps } from '../types';

/**
 * Props for the [`RNHostView`](#rnhostview) component.
 */
export interface RNHostViewProps extends UniversalBaseProps {
  /**
   * When `true`, the host updates its size in the native view tree to match
   * the children's size. When `false`, the host uses the size of the parent
   * native view. Pass an object to choose per axis. For example, `{ vertical: true }`
   * takes the width from the parent and the height from the children, so text wraps
   * and grows vertically.
   *
   * Can only be set once on mount; changing it remounts the component.
   * @default false
   * @platform android
   * @platform ios
   */
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };

  onLayout?: (event: LayoutChangeEvent) => void;

  /**
   * The React Native view to host.
   */
  children: ReactElement;
}
