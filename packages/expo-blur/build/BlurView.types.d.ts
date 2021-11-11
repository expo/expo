import { ViewProps } from 'react-native';
export declare type BlurProps = {
    /**
     * A tint mode which will be applied to the view.
     * @default 'default'
     */
    tint: BlurTint;
    /**
     * A number from `1` to `100` to control the intensity of the blur effect.
     * @default 50
     */
    intensity: number;
} & ViewProps;
export declare type BlurTint = 'light' | 'dark' | 'default';
