import * as React from 'react';
import { BlurProps, BlurTint, ComponentOrHandle } from './BlurView.types';
export default class BlurView extends React.Component<BlurProps> {
    static defaultProps: {
        tint: BlurTint;
        intensity: number;
    };
    _root: ComponentOrHandle;
    _setNativeRef: (ref: ComponentOrHandle) => void;
    setNativeProps: (nativeProps: any) => void;
    render(): JSX.Element;
}
