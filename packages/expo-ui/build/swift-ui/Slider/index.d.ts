import { type CommonViewModifierProps } from '../types';
export type SliderProps = {
    /**
     * The current value of the slider.
     * @default 0
     */
    value?: number;
    /**
     * The number of steps between the minimum and maximum values, `0` signifies infinite steps.
     * @default 0
     */
    steps?: number;
    /**
     * The minimum value of the slider. Updating this value does not trigger callbacks if the current value is below `min`.
     * @default 0
     */
    min?: number;
    /**
     * The maximum value of the slider. Updating this value does not trigger callbacks if the current value is above `max`.
     * @default 1
     */
    max?: number;
    /**
     * Slider color.
     */
    color?: string;
    /**
     * Callback triggered on dragging along the slider.
     */
    onValueChange?: (value: number) => void;
} & CommonViewModifierProps;
export declare function Slider(props: SliderProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map