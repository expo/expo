import { requireNativeLayoutView } from '../../requireNativeLayoutView';
import { type CommonViewModifierProps } from '../types';

export interface AccessoryWidgetBackgroundProps extends CommonViewModifierProps {}

const AccessoryWidgetBackgroundNativeView: React.ComponentType<AccessoryWidgetBackgroundProps> =
  requireNativeLayoutView('ExpoUI', 'AccessoryWidgetBackgroundView');

export function AccessoryWidgetBackground(props: AccessoryWidgetBackgroundProps) {
  return <AccessoryWidgetBackgroundNativeView {...props} />;
}
