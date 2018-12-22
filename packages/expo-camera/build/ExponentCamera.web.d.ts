import React from 'react';
import { NativePropsType } from './Camera.types';
export default class ExponentCamera extends React.Component<NativePropsType> {
    video?: number | null;
    _setRef: (ref: any) => void;
    render(): JSX.Element;
}
