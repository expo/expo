import * as React from 'react';
import { View } from 'react-native';
export declare function HeaderContainerRight(props: React.ComponentProps<typeof View> & {
    children?: any;
}): JSX.Element;
declare type Props = {
    color?: string;
    disabled?: boolean;
    name: string;
    onPress: () => void;
    size?: number;
};
export default function HeaderIconButton({ color, disabled, name, onPress, size, }: Props): JSX.Element;
export {};
