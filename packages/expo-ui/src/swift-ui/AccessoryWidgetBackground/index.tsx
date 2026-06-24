import { requireNativeView } from 'expo';

import { type CommonViewModifierProps } from '../types';

export interface AccessoryWidgetBackgroundProps extends CommonViewModifierProps {}

const AccessoryWidgetBackgroundNativeView: React.ComponentType<AccessoryWidgetBackgroundProps> =
  requireNativeView('ExpoUI', 'AccessoryWidgetBackgroundView');

export function AccessoryWidgetBackground(props: AccessoryWidgetBackgroundProps) {
  return <AccessoryWidgetBackgroundNativeView {...props} />;
}
