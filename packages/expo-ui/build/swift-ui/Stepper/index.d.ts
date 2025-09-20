import { type CommonViewModifierProps } from '../types';
export type StepperProps = {
    /**
     * The label text displayed with the stepper.
     */
    label: string;
    /**
     * The current value of the stepper.
     */
    value: number;
    /**
     * Callback triggered when the increment button is pressed.
     * You should implement validation logic here.
     */
    onIncrement: (value: number) => void;
    /**
     * Callback triggered when the decrement button is pressed.
     * You should implement validation logic here.
     */
    onDecrement: (value: number) => void;
} & CommonViewModifierProps;
export declare function Stepper(props: StepperProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map