import React from 'react';
import * as SplashScreen from './SplashScreen';
export default class AppLoading extends React.Component {
    constructor(props) {
        super(props);
        SplashScreen.preventAutoHide();
    }
    componentWillUnmount() {
        if (this.props.autoHideSplash === undefined || this.props.autoHideSplash) {
            // Hide immediately in E2E tests
            if (global.__E2E__) {
                SplashScreen.hide();
            }
            else {
                setTimeout(() => {
                    SplashScreen.hide();
                }, 200);
            }
        }
    }
    render() {
        return null;
    }
}
//# sourceMappingURL=AppLoadingNativeWrapper.js.map