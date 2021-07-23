import { ActionSheetOptions } from '@expo/react-native-action-sheet';
import React from 'react';
interface Props {
    title: string;
    showActionSheetWithOptions: (options: ActionSheetOptions, onSelection: (index: number) => void) => void;
    onSelection: (index: number) => void;
    withTitle?: boolean;
    withMessage?: boolean;
    withIcons?: boolean;
    withSeparators?: boolean;
    withCustomStyles?: boolean;
}
export default class ShowActionSheetButton extends React.PureComponent<Props> {
    static defaultProps: {
        withTitle: boolean;
        withMessage: boolean;
        withIcons: boolean;
        withSeparators: boolean;
        withCustomStyles: boolean;
        onSelection: null;
    };
    _showActionSheet: () => void;
    render(): JSX.Element;
}
export {};
