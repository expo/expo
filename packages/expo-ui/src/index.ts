export type { SwitchProps } from './components/Switch';
export type { PickerProps } from './components/Picker';
export type { ButtonProps } from './components/Button';
export type { SectionProps } from './components/Section';
export type { SliderProps } from './components/Slider';
export { Switch } from './components/Switch';
export { Picker } from './components/Picker';
export { Button } from './components/Button';
export { Section } from './components/Section';
export { Slider } from './components/Slider';

/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data extends object> = Record<
  Name,
  (event: { nativeEvent: Data }) => void
>;
