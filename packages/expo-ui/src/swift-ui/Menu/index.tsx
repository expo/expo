import { requireNativeView } from 'expo';
import { ComponentType } from 'react';

import { type MenuProps } from './types';

export { type MenuProps } from './types';

type NativeMenuProps = Omit<MenuProps, 'label' | 'onPrimaryAction'> & {
  label?: string;
  hasPrimaryAction?: boolean;
  onPrimaryAction?: () => void;
};

const MenuNativeView: ComponentType<NativeMenuProps> = requireNativeView('ExpoUI', 'MenuView');

const MenuNativeLabelView: ComponentType<{ children: React.ReactNode }> = requireNativeView(
  'ExpoUI',
  'MenuLabel'
);

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
      {!isStringLabel && <MenuNativeLabelView>{label}</MenuNativeLabelView>}
      {children}
    </MenuNativeView>
  );
}
