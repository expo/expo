import type { StyleProp, ViewStyle } from 'react-native';
export type SingleChoiceSegmentedControlProps = {
    options: string[];
    selectedIndex: number | null;
    onOptionSelected: (event: {
        nativeEvent: {
            index: number;
            label: string;
        };
    }) => void;
    style?: StyleProp<ViewStyle>;
};
export type SliderProps = {
    value: number;
    onValueChanged: (event: {
        nativeEvent: {
            value: number;
        };
    }) => void;
    style?: StyleProp<ViewStyle>;
};
//# sourceMappingURL=ExpoUI.types.d.ts.map