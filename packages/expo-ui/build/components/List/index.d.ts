import { StyleProp, ViewStyle } from 'react-native';
export type ListProps = {
    /**
     * Custom styles for the progress component.
     */
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
};
export type ListItemProps = {
    onPress?: () => void;
};
export declare function ListItem(props: {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
}): import("react").JSX.Element;
export declare function List(props: ListProps): import("react").JSX.Element | null;
//# sourceMappingURL=index.d.ts.map