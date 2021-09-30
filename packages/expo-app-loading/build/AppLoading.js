import React from 'react';
import NativeAppLoading from './AppLoadingNativeWrapper';
class AppLoading extends React.Component {
    _isMounted = false;
    componentDidMount() {
        this._isMounted = true;
        this.startLoadingAppResourcesAsync().catch((error) => {
            console.error(`AppLoading threw an unexpected error when loading:\n${error}`);
        });
    }
    componentWillUnmount() {
        this._isMounted = false;
    }
    async startLoadingAppResourcesAsync() {
        if (!('startAsync' in this.props)) {
            return;
        }
        if (!('onFinish' in this.props)) {
            throw new Error('AppLoading onFinish prop is required if startAsync is provided');
        }
        if (!('onError' in this.props)) {
            throw new Error('AppLoading onError prop is required if startAsync is provided');
        }
        try {
            await this.props.startAsync();
        }
        catch (e) {
            if (!this._isMounted) {
                return;
            }
            this.props.onError(e);
        }
        finally {
            if (!this._isMounted) {
                return;
            }
            // If we get to this point then we know that either there was no error, or the error was handled.
            this.props.onFinish();
        }
    }
    render() {
        return React.createElement(NativeAppLoading, { ...this.props });
    }
}
export default AppLoading;
//# sourceMappingURL=AppLoading.js.map