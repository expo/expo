import { type SliderProps } from './types';
import { Host } from '../../jetpack-compose/Host';
import { Slider as ComposeSlider } from '../../jetpack-compose/Slider';

/**
 * A drop-in replacement for `@react-native-community/slider` on Android.
 * Renders a Material 3 `Slider` wrapped in a Host.
 */
export function Slider(props: SliderProps) {
  const { value, minimumValue, maximumValue, step, disabled, onValueChange, style } = props;
  const min = minimumValue ?? 0;
  const max = maximumValue ?? 1;
  const steps = step && step > 0 ? Math.max(0, Math.round((max - min) / step) - 1) : 0;
  return (
    <Host matchContents={{ vertical: true }} style={style}>
      <ComposeSlider
        value={value}
        min={minimumValue}
        max={maximumValue}
        steps={steps}
        enabled={disabled === undefined ? undefined : !disabled}
        onValueChange={onValueChange}
      />
    </Host>
  );
}

Slider.displayName = 'Slider';
