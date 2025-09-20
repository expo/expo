import { type CommonViewModifierProps } from '../types';
export interface FormProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * Makes the form scrollable.
     * @default true
     * @platform ios 16.0+
     */
    scrollEnabled?: boolean;
    /**
     * Controls the visibility of the scroll content background.
     * @default 'visible'
     * @platform ios 16.0+
     */
    scrollContentBackground?: 'visible' | 'hidden';
}
export declare function Form(props: FormProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map