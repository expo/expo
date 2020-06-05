import { ViewProps } from 'react-native';
export declare type BlurProps = {
    tint: BlurTint;
    intensity: number;
} & ViewProps;
export declare type BlurTint = 'light' | 'dark' | 'default';
export declare type ComponentOrHandle = null | number | React.Component<any, any> | React.ComponentClass<any>;
