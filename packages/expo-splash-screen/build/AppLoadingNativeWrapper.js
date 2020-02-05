import React from 'react';
import * as SplashScreen from './SplashScreen';
export default class AppLoading extends React.Component {
    constructor(props) {
        super(props);
        // TODO: it should work like this - no call to this component -> no preventAutoHide, but keep in mind that preventAutoHideAsync has to be called before react native's view hierarchy is mounted
        SplashScreen.preventAutoHideAsync();
    }
    componentWillUnmount() {
        if (this.props.autoHideSplash === undefined || this.props.autoHideSplash) {
            // Hide immediately in E2E tests
            // @ts-ignore
            if (global.__E2E__) {
                SplashScreen.hideAsync();
            }
            else {
                setTimeout(() => {
                    SplashScreen.hideAsync();
                }, 200);
            }
        }
    }
    render() {
        return null;
    }
}
//# sourceMappingURL=AppLoadingNativeWrapper.js.map