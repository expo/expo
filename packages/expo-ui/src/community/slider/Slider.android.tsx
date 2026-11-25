import { Host } from '../../jetpack-compose/Host';
import { Slider as ComposeSlider } from '../../jetpack-compose/Slider';
import { semantics, testID as testIDModifier } from '../../jetpack-compose/modifiers';
import type { ModifierConfig } from '../../types';
import { type SliderProps } from './types';

/**
 * A drop-in replacement for `@react-native-community/slider` on Android.
 * Renders a Material 3 `Slider` wrapped in a Host.
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
    maximumTrackTintColor,
    thumbTintColor,
    onValueChange,
    style,
    accessibilityLabel,
    testID,
  } = props;
  const min = minimumValue ?? 0;
  const max = maximumValue ?? 1;
  const steps = step && step > 0 ? Math.max(0, Math.round((max - min) / step) - 1) : 0;
  const hostStyle = inverted ? [style, { transform: [{ scaleX: -1 }] }] : style;
  const colors = {
    activeTrackColor: minimumTrackTintColor,
    inactiveTrackColor: maximumTrackTintColor,
    thumbColor: thumbTintColor,
  };
  // `accessibilityHint` has no Compose semantics counterpart, so it is iOS-only.
  const modifiers: ModifierConfig[] = [];
  if (accessibilityLabel !== undefined) {
    modifiers.push(semantics({ contentDescription: accessibilityLabel }));
  }
  if (testID !== undefined) modifiers.push(testIDModifier(testID));
  return (
    <Host matchContents={{ vertical: true }} style={hostStyle}>
      <ComposeSlider
        value={value}
        min={minimumValue}
        max={maximumValue}
        lowerLimit={lowerLimit}
        upperLimit={upperLimit}
        steps={steps}
        enabled={disabled === undefined ? undefined : !disabled}
        colors={colors}
        onValueChange={onValueChange}
        modifiers={modifiers.length > 0 ? modifiers : undefined}
      />
    </Host>
  );
}
