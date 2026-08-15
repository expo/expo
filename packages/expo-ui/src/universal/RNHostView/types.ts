import type { ReactElement } from 'react';

import type { UniversalBaseProps } from '../types';

/**
 * Props for the [`RNHostView`](#rnhostview) component.
 */
export interface RNHostViewProps extends UniversalBaseProps {
  /**
   * When `true`, the host updates its size in the native view tree to match
   * the children's size. When `false`, the host uses the size of the parent
   * native view.
   *
   * Can only be set once on mount; changing it remounts the component.
   * @default false
   * @platform android
   * @platform ios
   */
  matchContents?: boolean;

  /**
   * The React Native view to host.
   */
  children: ReactElement;
}
