import React from 'react';
import * as SplashScreen from './SplashScreen';
export default class AppLoading extends React.Component {
    constructor(props) {
        super(props);
        SplashScreen.preventAutoHideAsync();
    }
    componentWillUnmount() {
        if (this.props.autoHideSplash) {
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
AppLoading.defaultProps = {
    autoHideSplash: true,
};
//# sourceMappingURL=AppLoadingNativeWrapper.js.map