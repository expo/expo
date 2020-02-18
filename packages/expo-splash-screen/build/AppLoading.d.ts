import { EventEmitter } from 'fbemitter';
import React from 'react';
export interface AppLoadingProps {
    startAsync?: () => Promise<void>;
    onError?: (error: Error) => void;
    onFinish?: () => void;
    autoHideSplash?: boolean;
}
export declare class AppLoading extends React.Component<AppLoadingProps> {
    isMounted: boolean;
    componentDidMount(): void;
    componentWillUnmount(): void;
    startLoadingAppResourcesAsync: () => Promise<void>;
    render(): JSX.Element;
}
export declare function getAppLoadingLifecycleEmitter(): EventEmitter;
