import { type SliderProps } from './types';
import { Host } from '../../jetpack-compose/Host';
import { Slider as ComposeSlider } from '../../jetpack-compose/Slider';

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
      />
    </Host>
  );
}
