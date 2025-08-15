import { ReactElement, ReactNode } from 'react';
import { NativeSyntheticEvent } from 'react-native';

import { type ButtonProps } from '../Button';
import { type PickerProps } from '../Picker';
import { type SwitchProps } from '../Switch';
import { type SubmenuProps } from './Submenu';

export type EventHandlers = Record<
  string,
  Record<string, (event: NativeSyntheticEvent<any>) => void>
>;

export type ContextMenuElementBase = { contextMenuElementID: string };

type SubmenuElement =
  | ReactElement<ButtonProps>
  | ReactElement<SwitchProps>
  | ReactElement<PickerProps>
  | ReactElement<SubmenuProps>;

export type ContextMenuContentProps = {
  children: SubmenuElement | SubmenuElement[];
};

/**
 * Activation method of the context menu.
 * - `singlePress`: The context menu is opened with a single tap. Does not isolate the content.
 * - `longPress`: The context menu is opened with a long press. On iOS additionally Highlights the content by blurring the background.
 */
export type ActivationMethod = 'singlePress' | 'longPress';

/**
 * Props of the `ContextMenu` component.
 */
export type ContextMenuProps = {
  /**
   * Determines how the context menu will be activated.
   */
  activationMethod?: ActivationMethod;

  /**
   * The contents of the submenu are used as an anchor for the context menu.
   * The children will be wrapped in a pressable element, which triggers opening of the context menu.
   */
  children: ReactNode;
};
