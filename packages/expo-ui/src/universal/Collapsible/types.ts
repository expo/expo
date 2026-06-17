import type { Ref } from 'react';

import type { UniversalTextStyle } from '../Text/types';

/**
 * Props for the [`Collapsible`](#collapsible) component, a primitive that
 * shows or hides its content with a tap on a labelled header.
 */
export interface CollapsibleProps {
  /**
   * Whether the content is currently expanded.
   */
  isOpen: boolean;

  /**
   * Called when the user taps the header to toggle the open state.
   */
  onOpenChange: (isOpen: boolean) => void;

  /**
   * Text rendered in the tappable header.
   */
  label?: string;

  /**
   * Text-specific styling for the tappable header label.
   */
  labelStyle?: UniversalTextStyle;

  /**
   * Content rendered when `isOpen` is `true`.
   */
  children?: React.ReactNode;

  /**
   * Forwarded to the underlying native view: the SwiftUI view on iOS, the Jetpack
   * Compose view on Android, or the rendered React Native element on web. An escape
   * hatch for advanced cases that need the native handle; not part of the public API.
   * @hidden
   */
  ref?: Ref<any>;
}
