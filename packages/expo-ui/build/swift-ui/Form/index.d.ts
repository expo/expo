import { type CommonViewModifierProps } from '../types';
export interface FormProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * Makes the form scrollable.
     * @default true
     * @platform ios 16.0+
     */
    scrollEnabled?: boolean;
}
export declare function Form(props: FormProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map