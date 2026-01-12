import { type CommonViewModifierProps } from '../types';
export interface GroupProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * Callback triggered when the view is pressed.
     */
    onPress?: () => void;
}
export declare function Group(props: GroupProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map