import { ReactNode } from 'react';

import { type CommonViewModifierProps } from '../types';

/**
 * Props for the `Menu` component.
 */
export type MenuProps = {
  /**
   * The label for the menu trigger. Can be a string for simple text labels,
   * or a ReactNode for custom label content.
   */
  label: string | ReactNode;
  /**
   * An SF Symbol name to display alongside the label.
   * Only used when `label` is a string.
   */
  systemImage?: string;
  /**
   * A callback that is invoked when the user taps the menu label.
   * When provided, a single tap triggers this action, while a long-press shows the menu.
   * When not provided, a single tap shows the menu.
   */
  onPrimaryAction?: () => void;
  /**
   * The content of the menu - the items shown when the menu is opened.
   * Can contain `Button`, `Switch`, `Picker`, `Section`, `Divider`, or nested `Menu` components.
   */
  children: ReactNode;
} & CommonViewModifierProps;
