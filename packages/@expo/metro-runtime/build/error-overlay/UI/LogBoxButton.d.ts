import { GestureResponderEvent, Insets, ViewStyle } from 'react-native';
type Props = {
    backgroundColor: {
        default: string;
        pressed: string;
    };
    children?: any;
    hitSlop?: Insets;
    onPress?: ((event: GestureResponderEvent) => void) | null;
    style?: ViewStyle;
};
export declare function LogBoxButton(props: Props): JSX.Element;
export {};
//# sourceMappingURL=LogBoxButton.d.ts.map