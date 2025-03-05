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
    /**
     * Additional styles to apply to the label.
     */
    style?: StyleProp<ViewStyle>;
};
/**
 * Renders a native label view, which could be used in a lsit or section .
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 */
export declare function Label(props: LabelProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map