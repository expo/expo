import React from 'react';
import { EventSubscription, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated from 'react-native-reanimated';

import DevMenuContext from '../DevMenuContext';
import * as DevMenuInternal from '../DevMenuInternal';
import DevMenuMainScreen from '../screens/DevMenuMainScreen';
import DevMenuSettingsScreen from '../screens/DevMenuSettingsScreen';
import DevMenuTestScreen from '../screens/DevMenuTestScreen';
import DevMenuBottomSheet from './DevMenuBottomSheet';
import DevMenuOnboarding from './DevMenuOnboarding';
import NavigationHeaderButton from '../components/NavigationHeaderButton';

type Props = {
  uuid: string;
  showOnboardingView: boolean;
};

const { call, cond, eq, onChange } = Animated;

function applyNavigationSettings(navigationOptions) {
  return ({ navigation }) => ({
    headerTitleAlign: 'center',
    headerLeft: () => <NavigationHeaderButton onPress={() => navigation.pop()} />,
    ...navigationOptions,
  });
}

// @refresh
export default class DevMenuContainer extends React.PureComponent<Props, any> {
  ref = React.createRef<DevMenuBottomSheet>();

  snapPoints = [0, '60%', '75%', '90%'];

  callbackNode = new Animated.Value(0);

  backgroundOpacity = this.callbackNode.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  closeSubscription: EventSubscription | null = null;

  componentDidMount() {
    this.expand();

    // Before the dev menu can be actually closed, we need to collapse its sheet view,
    // and this listens for close requests that come from native side to start collapsing the view.
    this.closeSubscription = DevMenuInternal.subscribeToCloseEvents(() => {
      // Collapse the bottom sheet. `onCloseEnd` will be called once it ends.
      this.collapse();
    });
  }

  componentDidUpdate(prevProps) {
    // Make sure it gets expanded once we receive new identifier.
    if (prevProps.uuid !== this.props.uuid) {
      this.expand();
    }
  }

  componentWillUnmount() {
    this.closeSubscription?.remove(); // eslint-disable-line no-unused-expressions
    this.closeSubscription = null;
  }

  collapse = () => {
    this.ref.current?.snapTo(0); // eslint-disable-line no-unused-expressions
  };

  expand = () => {
    this.ref.current?.snapTo(1); // eslint-disable-line no-unused-expressions
  };

  onCloseEnd = () => {
    DevMenuInternal.hideMenu();
  };

  providedContext = {
    expand: this.expand,
    collapse: this.collapse,
  };

  trackCallbackNode = onChange(
    this.callbackNode,
    cond(eq(this.callbackNode, 0), call([], this.onCloseEnd))
  );

  screens = [
    {
      name: 'Main',
      component: DevMenuMainScreen,
      options: applyNavigationSettings(DevMenuMainScreen.navigationOptions),
    },
    {
      name: 'Settings',
      component: DevMenuSettingsScreen,
      options: applyNavigationSettings(DevMenuSettingsScreen.navigationOptions),
    },
    {
      name: 'Test',
      component: DevMenuTestScreen,
      options: applyNavigationSettings(DevMenuTestScreen.navigationOptions),
    },
  ];

  render() {
    const providedContext = {
      ...this.props,
      ...this.providedContext,
    };

    return (
      <DevMenuContext.Provider value={providedContext}>
        <View style={styles.bottomSheetContainer}>
          <TouchableWithoutFeedback onPress={this.collapse}>
            <Animated.View
              style={[styles.bottomSheetBackground, { opacity: this.backgroundOpacity }]}
            />
          </TouchableWithoutFeedback>
          <DevMenuBottomSheet
            ref={this.ref}
            initialSnap={0}
            snapPoints={this.snapPoints}
            callbackNode={this.callbackNode}
            screens={this.screens}>
            <DevMenuOnboarding show={this.props.showOnboardingView} />
          </DevMenuBottomSheet>
        </View>
        <Animated.Code exec={this.trackCallbackNode} />
      </DevMenuContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    flex: 1,
  },
  bottomSheetBackground: {
    flex: 1,
    backgroundColor: '#000',
  },
});
