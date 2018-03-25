import React, { PropTypes } from 'react';
import { Constants } from 'expo';

import ExNavigator from '@expo/react-native-navigator';
import ConsoleRouter from './ConsoleRouter';

const NAVIGATION_BAR_HEIGHT = 44;

export default class ConsoleNavigator extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    isUserFacing: PropTypes.bool.isRequired,
    onPressReload: PropTypes.func.isRequired,
  };

  render() {
    let initialRoute = ConsoleRouter.getConsoleHistoryRoute(
      this.props.onPressReload,
      this.props.isUserFacing
    );
    return (
      <ExNavigator
        navigator={this.props.navigator}
        initialRoute={initialRoute}
        sceneStyle={styles.scene}
      />
    );
  }
}

const styles = {
  scene: {
    paddingTop: Constants.statusBarHeight + NAVIGATION_BAR_HEIGHT,
  },
};
