import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * The type of gauge label.
 */
type GaugeLabelKind = 'label' | 'currentValue' | 'minimumValue' | 'maximumValue';

export type GaugeProps = {
  /**
   * The current value of the gauge.
   */
  value: number;
  /**
   * The minimum value of the gauge range.
   * @default 0
   */
  min?: number;
  /**
   * The maximum value of the gauge range.
   * @default 1
   */
  max?: number;
  /**
   * A label describing the gauge's purpose.
   */
  children?: React.ReactNode;
  /**
   * A label showing the current value. Use `Text` or `Label` to display the value.
   */
  currentValueLabel?: React.ReactNode;
  /**
   * A label showing the minimum value. Use `Text` or `Label` to display the value.
   */
  minimumValueLabel?: React.ReactNode;
  /**
   * A label showing the maximum value. Use `Text` or `Label` to display the value.
   */
  maximumValueLabel?: React.ReactNode;
} & CommonViewModifierProps;

type NativeGaugeProps = Omit<
  GaugeProps,
  'currentValueLabel' | 'minimumValueLabel' | 'maximumValueLabel'
> & {
  children?: React.ReactNode;
};

const GaugeNativeView: React.ComponentType<NativeGaugeProps> = requireNativeView(
  'ExpoUI',
  'GaugeView'
);

const GaugeLabelNativeView: React.ComponentType<{
  kind: GaugeLabelKind;
  children?: React.ReactNode;
}> = requireNativeView('ExpoUI', 'GaugeLabelView');

/**
 * Renders a SwiftUI `Gauge` component.
 */
export function Gauge(props: GaugeProps) {
  const {
    modifiers,
    children,
    currentValueLabel,
    minimumValueLabel,
    maximumValueLabel,
    ...restProps
  } = props;

  return (
    <GaugeNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children && <GaugeLabelNativeView kind="label">{children}</GaugeLabelNativeView>}
      {currentValueLabel && (
        <GaugeLabelNativeView kind="currentValue">{currentValueLabel}</GaugeLabelNativeView>
      )}
      {minimumValueLabel && (
        <GaugeLabelNativeView kind="minimumValue">{minimumValueLabel}</GaugeLabelNativeView>
      )}
      {maximumValueLabel && (
        <GaugeLabelNativeView kind="maximumValue">{maximumValueLabel}</GaugeLabelNativeView>
      )}
    </GaugeNativeView>
  );
}
