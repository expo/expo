import { StyleProp, ViewStyle } from 'react-native';
export type LabelProps = {
    /**
     * The title text to be displayed in the label.
     */
    title?: string;
    /**
     * The name of the SFSymbol to be displayed in the label.
     */
    systemImage?: string;
    /**
     * The color of the label icon.
     */
    color?: string;
};
/**
 * `<Label>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function LabelPrimitive(props: LabelProps): import("react").JSX.Element;
/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export declare function Label(props: LabelProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map