import { type SliderProps } from './types';
import { Host } from '../../swift-ui/Host';
import { Slider as SwiftUISlider } from '../../swift-ui/Slider';
import { disabled as disabledModifier, tint as tintModifier } from '../../swift-ui/modifiers';
import type { ModifierConfig } from '../../types';

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
    minimumTrackTintColor,
    onValueChange,
    style,
  } = props;
  const hostStyle = inverted ? [style, { transform: [{ scaleX: -1 }] }] : style;
  // SwiftUI's Slider only exposes `.tint(...)` for the minimum (active)
  // track. `maximumTrackTintColor` and `thumbTintColor` are accepted at the
  // type level but not visually applied on iOS
  const modifiers: ModifierConfig[] = [];
  if (disabled) modifiers.push(disabledModifier(true));
  if (minimumTrackTintColor !== undefined) {
    modifiers.push(tintModifier(minimumTrackTintColor as string));
  }
  return (
    <Host matchContents={{ vertical: true }} style={hostStyle}>
      <SwiftUISlider
        value={value}
        min={minimumValue}
        max={maximumValue}
        lowerLimit={lowerLimit}
        upperLimit={upperLimit}
        step={step && step > 0 ? step : undefined}
        modifiers={modifiers.length > 0 ? modifiers : undefined}
        onValueChange={onValueChange}
      />
    </Host>
  );
}
