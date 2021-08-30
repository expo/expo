import React from 'react';
import { AppLoadingProps } from './AppLoading.types';
export default class AppLoading extends React.Component<AppLoadingProps> {
    _isMounted: boolean;
    componentDidMount(): void;
    componentWillUnmount(): void;
    private startLoadingAppResourcesAsync;
    render(): JSX.Element;
}
