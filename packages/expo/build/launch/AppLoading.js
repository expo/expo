import { EventEmitter } from 'fbemitter';
import React from 'react';
import NativeAppLoading from './AppLoadingNativeWrapper';
export default class AppLoading extends React.Component {
    constructor() {
        super(...arguments);
        this._isMounted = false;
        this._startLoadingAppResourcesAsync = async () => {
            if (!this.props.onFinish) {
                throw new Error('AppLoading onFinish prop is required if startAsync is provided');
            }
            try {
                await this.props.startAsync();
            }
            catch (e) {
                if (!this._isMounted)
                    return;
                if (this.props.onError) {
                    this.props.onError(e);
                }
                else {
                    throw e;
                }
            }
            finally {
                if (!this._isMounted)
                    return;
                // If we get to this point then we know that either there was no error, or the error was
                // handled.
                if (this.props.onFinish) {
                    this.props.onFinish();
                }
            }
        };
    }
    componentDidMount() {
        this._isMounted = true;
        _emitEvent('componentDidMount');
        // startAsync is optional, you can do this process manually if you prefer (this is mainly for
        // backwards compatibility and it is not recommended)
        if (this.props.startAsync) {
            this._startLoadingAppResourcesAsync().catch(error => {
                console.error(`AppLoading threw an unexpected error when loading:\n${error.stack}`);
            });
        }
    }
    componentWillUnmount() {
        this._isMounted = false;
        _emitEvent('componentWillUnmount');
    }
    render() {
        return React.createElement(NativeAppLoading, Object.assign({}, this.props));
    }
}
let _lifecycleEmitter = null;
function _emitEvent(event) {
    if (_lifecycleEmitter) {
        _lifecycleEmitter.emit(event);
    }
}
export function getAppLoadingLifecycleEmitter() {
    if (!_lifecycleEmitter) {
        _lifecycleEmitter = new EventEmitter();
    }
    return _lifecycleEmitter;
}
//# sourceMappingURL=AppLoading.js.map