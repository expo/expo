import { requireNativeView } from 'expo';

import { type CommonViewModifierProps } from '../types';

export type AccessoryWidgetBackgroundProps = CommonViewModifierProps;

const AccessoryWidgetBackgroundNativeView: React.ComponentType<AccessoryWidgetBackgroundProps> =
  requireNativeView('ExpoUI', 'AccessoryWidgetBackgroundView');

export function AccessoryWidgetBackground(props: AccessoryWidgetBackgroundProps) {
  return <AccessoryWidgetBackgroundNativeView {...props} />;
}
