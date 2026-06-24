import { type CommonViewModifierProps } from '../types';
/**
 * Props of the `Alert` component.
 */
export interface AlertProps extends CommonViewModifierProps {
    /**
     * The contents of the alert.
     * Should include `Alert.Trigger`, `Alert.Actions`, and optionally `Alert.Message`.
     */
    children: React.ReactNode;
    /**
     * The title of the alert.
     */
    title: string;
    /**
     * Whether the alert is presented.
     */
    isPresented?: boolean;
    /**
     * A callback that is called when the `isPresented` state changes.
     */
    onIsPresentedChange?: (isPresented: boolean) => void;
}
/**
 * `Alert` presents a SwiftUI alert with a title, optional message, and action buttons.
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/alert(_:ispresented:actions:message:)).
 */
declare function Alert(props: AlertProps): import("react/jsx-runtime").JSX.Element;
declare namespace Alert {
    var Trigger: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Actions: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Message: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
export { Alert };
//# sourceMappingURL=index.d.ts.map