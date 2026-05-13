import { type CommonViewModifierProps } from '../types';
export type StepperProps = {
    /**
     * The label text displayed with the stepper.
     */
    label: string;
    /**
     * The current value of the stepper.
     */
    value?: number;
    /**
     * The step value for increment/decrement operations.
     */
    step?: number;
    /**
     * The minimum value allowed.
     */
    min?: number;
    /**
     * The maximum value allowed.
     */
    max?: number;
    /**
     * Called when the stepper value changes.
     */
    onValueChange: (value: number) => void;
} & CommonViewModifierProps;
export declare function Stepper(props: StepperProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map