import { EventEmitter } from 'fbemitter';
import React from 'react';
import NativeAppLoading from './AppLoadingNativeWrapper';
export class AppLoading extends React.Component {
    constructor() {
        super(...arguments);
        this.isMounted = false;
        this.startLoadingAppResourcesAsync = async () => {
            const { onFinish, startAsync, onError } = this.props;
            if (!startAsync) {
                return;
            }
            if (!onFinish) {
                throw new Error('AppLoading onFinish prop is required if startAsync is provided.');
            }
            try {
                await startAsync();
            }
            catch (e) {
                if (!this.isMounted) {
                    return;
                }
                if (onError) {
                    onError(e);
                }
                else {
                    throw e;
                }
            }
            finally {
                if (!this.isMounted) {
                    return;
                }
                // If we get to this point then we know that either there was no error, or the error was handled.
                if (onFinish) {
                    onFinish();
                }
            }
        };
    }
    componentDidMount() {
        this.isMounted = true;
        emitEvent('componentDidMount');
        // startAsync is optional, you can do this process manually if you prefer
        // (this is mainly for backwards compatibility and it is not recommended)
        this.startLoadingAppResourcesAsync().catch(error => console.error(`AppLoading threw an unexpected error when loading:\n${error.stack}`));
    }
    componentWillUnmount() {
        this.isMounted = false;
        emitEvent('componentWillUnmount');
    }
    render() {
        return <NativeAppLoading {...this.props}/>;
    }
}
let lifecycleEmitter;
function emitEvent(event) {
    if (lifecycleEmitter) {
        lifecycleEmitter.emit(event);
    }
}
export function getAppLoadingLifecycleEmitter() {
    if (!lifecycleEmitter) {
        lifecycleEmitter = new EventEmitter();
    }
    return lifecycleEmitter;
}
//# sourceMappingURL=AppLoading.js.map