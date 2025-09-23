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
    onIncrement: (value: number) => void;
    onDecrement: (value: number) => void;
} & CommonViewModifierProps;
export declare function Stepper(props: StepperProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map