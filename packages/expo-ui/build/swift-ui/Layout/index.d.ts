import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';
type TapEvent = ViewEvent<'onTap', object> & {
    useTapGesture?: boolean;
};
interface StackBaseProps extends CommonViewModifierProps {
    children: React.ReactNode;
    spacing?: number;
    backgroundColor?: string;
    /**
     * Callback triggered when the view is pressed.
     */
    onPress?: () => void;
}
export type NativeStackProps = Omit<StackBaseProps, 'onPress'> | TapEvent;
export interface HStackProps extends StackBaseProps {
    alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
}
export declare function HStack(props: HStackProps): import("react").JSX.Element;
export interface VStackProps extends StackBaseProps {
    alignment?: 'leading' | 'center' | 'trailing';
}
export declare function VStack(props: VStackProps): import("react").JSX.Element;
export interface GroupProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * Callback triggered when the view is pressed.
     */
    onPress?: () => void;
}
export declare function Group(props: GroupProps): import("react").JSX.Element;
export interface ZStackProps extends StackBaseProps {
    alignment?: 'center' | 'leading' | 'trailing' | 'top' | 'bottom' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing' | 'centerFirstTextBaseline' | 'centerLastTextBaseline' | 'leadingFirstTextBaseline' | 'leadingLastTextBaseline' | 'trailingFirstTextBaseline' | 'trailingLastTextBaseline';
}
export declare function ZStack(props: ZStackProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map