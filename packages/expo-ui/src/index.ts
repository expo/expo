export type { Switch, SwitchProps } from '../components/Switch';
export type { Picker, PickerProps } from '../components/Picker';
export type { Button, ButtonProps } from '../components/Button';
export type { Section, SectionProps } from '../components/Section';
export type { Slider, SliderProps } from '../components/Slider';

/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data> = Record<
  Name,
  Data extends object
    ? ((event: { nativeEvent: Data }) => void) | undefined
    : (() => void) | undefined
>;
