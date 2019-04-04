import { View } from 'react-native';
export declare type Props = {
    tint: BlurTint;
    intensity: number;
} & React.ComponentProps<typeof View>;
export declare type BlurTint = 'light' | 'dark' | 'default';
export declare type ComponentOrHandle = null | number | React.Component<any, any> | React.ComponentClass<any>;
