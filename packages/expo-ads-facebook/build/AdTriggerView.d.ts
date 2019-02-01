import React from 'react';
import { TouchableOpacity } from 'react-native';
declare type TouchableProps = {
    onPress?: (...args: any[]) => any;
};
declare type AdTriggerViewProps<P> = {
    renderInteractiveComponent?: (props: P) => React.ReactElement<P>;
} & P;
export default class AdTriggerView<P extends TouchableProps = React.ComponentProps<typeof TouchableOpacity>> extends React.Component<AdTriggerViewProps<P>> {
    _trigger: React.Component<P> | null;
    render(): JSX.Element;
    _getForwardedProps(): P;
    _renderDefaultInteractiveComponent(props: P): React.ReactElement<P>;
}
export {};
