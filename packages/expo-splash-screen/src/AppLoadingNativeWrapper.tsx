import React from 'react';

import * as SplashScreen from './SplashScreen';

declare namespace global {
  const __E2E__: boolean | undefined;
}

interface Props {
  autoHideSplash?: boolean;
}

export default class AppLoading extends React.Component<Props> {
  static defaultProps = {
    autoHideSplash: true,
  };

  constructor(props: Props) {
    super(props);
    SplashScreen.preventAutoHideAsync();
  }

  componentWillUnmount() {
    if (this.props.autoHideSplash) {
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
