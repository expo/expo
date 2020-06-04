import React from 'react';
export { getAppLoadingLifecycleEmitter } from './LifecycleEmitter';
declare const AppLoading: React.FC<AppLoadingProps>;
export default AppLoading;
export declare type AppLoadingProps = {
    startAsync?: () => Promise<void>;
    onError?: (error: Error) => void;
    onFinish?: () => void;
    autoHideSplash?: boolean;
};
