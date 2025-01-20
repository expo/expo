import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
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
export default function ExpoUIView(props: SingleChoiceSegmentedControlProps): React.JSX.Element;
//# sourceMappingURL=SingleChoiceSegmentedControlView.d.ts.map