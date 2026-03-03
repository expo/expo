import { requireNativeView } from 'expo';
import { ComponentType } from 'react';

import { type MenuProps } from './types';
import { Slot } from '../SlotView';

export { type MenuProps } from './types';

type NativeMenuProps = Omit<MenuProps, 'label' | 'onPrimaryAction'> & {
  label?: string;
  hasPrimaryAction?: boolean;
  onPrimaryAction?: () => void;
};

const MenuNativeView: ComponentType<NativeMenuProps> = requireNativeView('ExpoUI', 'MenuView');


/**
 * Displays a dropdown menu when tapped.
 */
export function Menu(props: MenuProps) {
  const { label, children, systemImage, onPrimaryAction, ...rest } = props;

  const isStringLabel = typeof label === 'string';

  return (
    <MenuNativeView
      label={isStringLabel ? label : undefined}
      systemImage={systemImage}
      hasPrimaryAction={onPrimaryAction != null}
      onPrimaryAction={onPrimaryAction}
      {...rest}>
      {!isStringLabel && <Slot name="label">{label}</Slot>}
      {children}
    </MenuNativeView>
  );
}
