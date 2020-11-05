import { EventEmitter } from 'fbemitter';
import React from 'react';
import NativeAppLoading from './AppLoadingNativeWrapper';
export default class AppLoading extends React.Component {
    constructor() {
        super(...arguments);
        this.isMounted = false;
        this.startLoadingAppResourcesAsync = async () => {
            if (!('startAsync' in this.props)) {
                return;
            }
            if (!('onFinish' in this.props)) {
                throw new Error('AppLoading onFinish prop is required if startAsync is provided');
            }
            try {
                await this.props.startAsync();
            }
            catch (e) {
                if (!this.isMounted) {
                    return;
                }
                this.props.onError(e);
            }
            finally {
                if (!this.isMounted) {
                    return;
                }
                // If we get to this point then we know that either there was no error, or the error was handled.
                this.props.onFinish?.();
            }
        };
    }
    componentDidMount() {
        this.isMounted = true;
        emitEvent('componentDidMount');
        this.startLoadingAppResourcesAsync()
            .catch(error => {
            console.error(`AppLoading threw an unexpected error when loading:\n${error.stack}`);
        });
    }
    componentWillUnmount() {
        this.isMounted = false;
        emitEvent('componentWillUnmount');
    }
    render() {
        return React.createElement(NativeAppLoading, Object.assign({}, this.props));
    }
}
let lifecycleEmitter = null;
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