import { StyleProp, ViewStyle } from 'react-native';
export type ContainerProps = {
    children: React.ReactNode;
    style: StyleProp<ViewStyle>;
};
export declare function Container(props: ContainerProps): import("react").JSX.Element | null;
export type FormProps = {
    children: React.ReactNode;
};
export declare function Form(props: FormProps): import("react").JSX.Element | null;
export type SectionProps = {
    children: React.ReactNode;
    title: string;
};
export declare function Section(props: SectionProps): import("react").JSX.Element | null;
export type ButtonProps = {
    children: React.ReactNode;
    onPress?: () => void;
};
export declare function Button(props: ButtonProps): import("react").JSX.Element | null;
export type PickerProps = {
    label: string;
    options: string[];
    selectedIndex: number | null;
    onOptionSelected?: (event: {
        nativeEvent: {
            index: number;
            label: string;
        };
    }) => void;
    variant?: 'automatic';
};
export declare function Picker(props: PickerProps): import("react").JSX.Element | null;
export type SwitchProps = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};
export declare function Switch(props: SwitchProps): import("react").JSX.Element | null;
export type TextProps = {
    children: string;
    /**
     * The font weight of the text.
     * Maps to iOS system font weights.
     */
    weight?: 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
    /**
     * The font design of the text.
     * Maps to iOS system font designs.
     */
    design?: 'default' | 'rounded' | 'serif' | 'monospaced';
    /**
     * The font size of the text.
     */
    size?: number;
    /**
     * The line limit of the text.
     */
    lineLimit?: number;
};
export declare function Text(props: TextProps): import("react").JSX.Element | null;
type StackBaseProps = {
    children: React.ReactNode;
    spacing?: number;
    padding?: number;
    frame?: {
        width?: number;
        height?: number;
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
    };
};
export type HStackProps = StackBaseProps;
export declare function HStack(props: HStackProps): import("react").JSX.Element | null;
export type VStackProps = StackBaseProps;
export declare function VStack(props: VStackProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=index.d.ts.map