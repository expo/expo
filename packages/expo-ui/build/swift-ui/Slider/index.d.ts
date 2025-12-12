import { type CommonViewModifierProps } from '../types';
export type SliderProps = {
    /**
     * The current value of the slider.
     */
    value?: number;
    /**
     * The step increment for the slider. Use `0` for continuous (no steps).
     */
    step?: number;
    /**
     * The minimum value of the slider. Updating this value does not trigger callbacks if the current value is below `min`.
     */
    min?: number;
    /**
     * The maximum value of the slider. Updating this value does not trigger callbacks if the current value is above `max`.
     */
    max?: number;
    /**
     * A label describing the slider's purpose.
     */
    label?: React.ReactNode;
    /**
     * A label displayed at the minimum value position.
     */
    minimumValueLabel?: React.ReactNode;
    /**
     * A label displayed at the maximum value position.
     */
    maximumValueLabel?: React.ReactNode;
    /**
     * Callback triggered on dragging along the slider.
     */
    onValueChange?: (value: number) => void;
    /**
     * Callback triggered when the user starts or ends editing the slider.
     */
    onEditingChanged?: (isEditing: boolean) => void;
} & CommonViewModifierProps;
export declare function Slider(props: SliderProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map