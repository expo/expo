import * as React from 'react';
import { View } from 'react-native';
export declare type BlurProps = {
    /**
     * A tint mode which will be applied to the view.
     * @default 'default'
     */
    tint: BlurTint;
    /**
     * A number from `1` to `100` to control the intensity of the blur effect.
     */
    intensity: number;
} & React.ComponentProps<typeof View>;
export declare type BlurTint = 'light' | 'dark' | 'default';
export declare type ComponentOrHandle = null | number | React.Component<any, any> | React.ComponentClass<any>;
