import { type SliderProps } from './types';
import { Host } from '../../swift-ui/Host';
import { Slider as SwiftUISlider } from '../../swift-ui/Slider';
import { disabled as disabledModifier } from '../../swift-ui/modifiers';

/**
 * A drop-in replacement for `@react-native-community/slider` on iOS.
 * Renders a SwiftUI `Slider` wrapped in a Host.
 */
export function Slider(props: SliderProps) {
  const {
    value,
    minimumValue,
    maximumValue,
    lowerLimit,
    upperLimit,
    step,
    disabled,
    inverted,
    onValueChange,
    style,
  } = props;
  const hostStyle = inverted ? [style, { transform: [{ scaleX: -1 }] }] : style;
  return (
    <Host matchContents={{ vertical: true }} style={hostStyle}>
      <SwiftUISlider
        value={value}
        min={minimumValue}
        max={maximumValue}
        lowerLimit={lowerLimit}
        upperLimit={upperLimit}
        step={step && step > 0 ? step : undefined}
        modifiers={disabled ? [disabledModifier(true)] : undefined}
        onValueChange={onValueChange}
      />
    </Host>
  );
}

Slider.displayName = 'Slider';
