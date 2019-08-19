import React from 'react';
import { TouchableWithoutFeedbackProps } from 'react-native';
export interface AddPassButtonProps extends TouchableWithoutFeedbackProps {
    type?: 'black' | 'blackOutline';
}
export default class AddPassButton extends React.Component<AddPassButtonProps> {
    render(): JSX.Element;
}
