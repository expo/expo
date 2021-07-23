import React from 'react';
import { TouchableHighlightProps } from 'react-native';
interface Props extends TouchableHighlightProps {
    title: string;
}
export default class ListButton extends React.Component<Props> {
    render(): JSX.Element;
}
export {};
