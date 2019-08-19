import React from 'react';
import { TouchableHighlightProps } from 'react-native';
export interface AddPassButtonProps extends TouchableHighlightProps {
    type?: 'black' | 'blackOutline';
}
export default class AddPassButton extends React.Component<AddPassButtonProps> {
    componentDidMount(): void;
    render(): JSX.Element;
}
