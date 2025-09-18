import { type CommonViewModifierProps } from '../types';
export type StepperProps = {
    /**
     * The label text displayed with the stepper.
     */
    label: string;
    /**
     * The default value of the stepper.
     * @default 0
     */
    defaultValue?: number;
    /**
     * The minimum value of the stepper.
     * @default 0
     */
    min?: number;
    /**
     * The maximum value of the stepper.
     * @default 100
     */
    max?: number;
    /**
     * The step value for incrementing/decrementing.
     * @default 1
     */
    step?: number;
    /**
     * Whether the stepper is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Callback triggered when the stepper value changes.
     */
    onValueChange?: (value: number) => void;
} & CommonViewModifierProps;
export declare function Stepper(props: StepperProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map