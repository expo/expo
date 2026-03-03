import { requireNativeView } from 'expo';
import { type ReactNode, type ComponentType } from 'react';
import { type SFSymbol } from 'sf-symbols-typescript';

import { createViewModifierEventListener } from '../modifiers/utils';
import { Slot } from '../SlotView';
import { type CommonViewModifierProps } from '../types';

export interface ControlGroupProps extends CommonViewModifierProps {
  /**
   * The label for the control group. Can be a string for simple text labels,
   * or a `Label` component for custom label content. When omitted, the control group
   * has no label.
   * @platform iOS 16.0+
   * @platform tvOS 17.0+
   */
  label?: string | ReactNode;
  /**
   * An SF Symbol name to display alongside the label.
   * Only used when `label` is a string.
   * @platform iOS 16.0+
   * @platform tvOS 17.0+
   */
  systemImage?: SFSymbol;
  /**
   * The control group's content.
   * Can contain `Button`, `Toggle`, `Picker`, or other interactive controls.
   * @platform iOS
   * @platform tvOS 17.0+
   */
  children: ReactNode;
}

type NativeControlGroupProps = Omit<ControlGroupProps, 'label'> & {
  label?: string;
};

const ControlGroupNativeView: ComponentType<NativeControlGroupProps> = requireNativeView(
  'ExpoUI',
  'ControlGroupView'
);


export function ControlGroup(props: ControlGroupProps) {
  const { label, children, systemImage, modifiers, ...rest } = props;

  const isStringLabel = typeof label === 'string';

  return (
    <ControlGroupNativeView
      label={isStringLabel ? label : undefined}
      systemImage={systemImage}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...rest}>
      {!isStringLabel && label != null ? <Slot name="label">{label}</Slot> : null}
      {children}
    </ControlGroupNativeView>
  );
}
