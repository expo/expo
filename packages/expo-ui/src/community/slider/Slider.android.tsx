import { type SliderProps } from './types';
import { Host } from '../../jetpack-compose/Host';
import { Slider as ComposeSlider } from '../../jetpack-compose/Slider';

/**
 * A drop-in replacement for `@react-native-community/slider` on Android.
 * Renders a Material 3 `Slider` wrapped in a Host.
 */
export function Slider(props: SliderProps) {
  const { value, minimumValue, maximumValue, onValueChange, style } = props;
  return (
    <Host matchContents={{ vertical: true }} style={style}>
      <ComposeSlider
        value={value}
        min={minimumValue}
        max={maximumValue}
        onValueChange={onValueChange}
      />
    </Host>
  );
}

Slider.displayName = 'Slider';
