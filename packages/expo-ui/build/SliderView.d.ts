import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
export type SliderProps = {
    value: number;
    min?: number;
    max?: number;
    steps?: number;
    onValueChanged: (event: {
        nativeEvent: {
            value: number;
        };
    }) => void;
    style?: StyleProp<ViewStyle>;
};
export default function ExpoUIView(props: SliderProps): React.JSX.Element;
//# sourceMappingURL=SliderView.d.ts.map