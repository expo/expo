import { EventEmitter } from 'fbemitter';
import React from 'react';
declare type Props = {
    startAsync?: () => Promise<void>;
    onError?: (error: Error) => void;
    onFinish?: () => void;
    autoHideSplash?: boolean;
} | {
    startAsync: null;
    onError: null;
    onFinish: null;
};
export default class AppLoading extends React.Component<Props> {
    _isMounted: boolean;
    componentDidMount(): void;
    componentWillUnmount(): void;
    _startLoadingAppResourcesAsync: () => Promise<void>;
    render(): JSX.Element;
}
export declare function getAppLoadingLifecycleEmitter(): EventEmitter;
export {};
