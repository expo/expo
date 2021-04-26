import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
export default class AppLoading extends React.Component {
    constructor(props) {
        super(props);
        SplashScreen.preventAutoHideAsync();
    }
    componentWillUnmount() {
        if (this.props.autoHideSplash === false) {
            return;
        }
        // @ts-ignore
        if (global.__E2E__) {
            // Hide immediately in E2E tests
            SplashScreen.hideAsync();
        }
        else {
            setTimeout(SplashScreen.hideAsync, 200);
        }
    }
    render() {
        return null;
    }
}
AppLoading.defaultProps = {
    autoHideSplash: true,
};
//# sourceMappingURL=AppLoadingNativeWrapper.js.map