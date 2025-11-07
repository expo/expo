import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type StyleProp, type TextStyle } from 'react-native';
export type StackHeaderTitleProps = {
    children?: string;
    style?: StyleProp<{
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: Exclude<TextStyle['fontWeight'], number>;
        color?: string;
        textAlign?: 'left' | 'center';
    }>;
    largeStyle?: StyleProp<{
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: Exclude<TextStyle['fontWeight'], number>;
        color?: string;
    }>;
    large?: boolean;
};
export declare function StackHeaderTitle(props: StackHeaderTitleProps): null;
export declare function appendStackHeaderTitlePropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderTitleProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackHeaderTitle.d.ts.map