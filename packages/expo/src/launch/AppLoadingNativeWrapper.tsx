import * as SplashScreen from 'expo-splash-screen';
import React from 'react';

type Props = {
  autoHideSplash?: boolean;
};

export default class AppLoading extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    SplashScreen.preventAutoHideAsync();
  }

  componentWillUnmount() {
    if (this.props.autoHideSplash === undefined || this.props.autoHideSplash) {
      // Hide immediately in E2E tests
      if (global.__E2E__) {
        SplashScreen.hideAsync();
      } else {
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
