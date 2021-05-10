import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { EventSubscription, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated from 'react-native-reanimated';

import DevMenuContext from '../DevMenuContext';
import * as DevMenuInternal from '../DevMenuInternal';
import ApolloClient, { setApolloSession } from '../api/ApolloClient';
import NavigationHeaderButton from '../components/NavigationHeaderButton';
import DevMenuScreen from '../components/items/DevMenuScreen';
import DevMenuMainScreen from '../screens/DevMenuMainScreen';
import DevMenuProfile from '../screens/DevMenuProfileScreen';
import DevMenuSettingsScreen from '../screens/DevMenuSettingsScreen';
import DevMenuBottomSheet from './DevMenuBottomSheet';
import DevMenuOnboarding from './DevMenuOnboarding';

type Props = {
  uuid: string;
  showOnboardingView: boolean;
};

const { call, cond, eq, onChange } = Animated;

function applyNavigationSettings(navigationOptions, collapse) {
  return ({ navigation }) => ({
    headerTitleAlign: 'center',
    headerStyle: {
      height: 60,
    },
    headerTitleStyle: {
      fontSize: 16,
    },
    safeAreaInsets: {
      top: 5,
      right: 0,
      bottom: 0,
      left: 0,
    },
    headerLeft: () => (
      <NavigationHeaderButton
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.pop();
          } else {
            collapse();
          }
        }}
      />
    ),
    ...navigationOptions,
  });
}

// @refresh
export default class DevMenuContainer extends React.PureComponent<Props, any> {
  state = {
    isAuthenticated: false,
    animationEnabled: true,
  };

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

    const tryRestoreSession = async () => {
      const session = await DevMenuInternal.restoreSessionAsync();
      if (session) {
        try {
          await this.setSession(session);
        } catch (ignore) {}
      }
    };

    tryRestoreSession();
  }

  componentDidUpdate(prevProps) {
    // Make sure it gets expanded once we receive new identifier.
    if (prevProps.uuid !== this.props.uuid) {
      if (prevProps.openScreen !== this.props.openScreen) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ animationEnabled: false });
        const listener = () => {
          this.expand();

          this.setState({ animationEnabled: true });

          this.props.navigation?.removeListener('state', listener);
        };

        this.props.navigation?.reset({
          index: 0,
          routes: [{ name: this.props.openScreen || 'Main' }],
        });

        this.props.navigation?.addListener('state', listener);
      } else {
        this.expand();
      }
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

  setSession = async session => {
    setApolloSession(session);
    await DevMenuInternal.setSessionAsync(session);

    this.setState({ isAuthenticated: session !== null });
    if (!session) {
      ApolloClient.resetStore();
    }
  };

  providedContext = {
    expand: this.expand,
    collapse: this.collapse,
    setSession: this.setSession,
  };

  trackCallbackNode = onChange(
    this.callbackNode,
    cond(eq(this.callbackNode, 0), call([], this.onCloseEnd))
  );

  screens = [
    {
      name: 'Main',
      component: DevMenuMainScreen,
      options: applyNavigationSettings(
        DevMenuMainScreen.navigationOptions,
        this.providedContext.collapse
      ),
    },
    {
      name: 'Settings',
      component: DevMenuSettingsScreen,
      options: applyNavigationSettings(
        DevMenuSettingsScreen.navigationOptions,
        this.providedContext.collapse
      ),
    },
    {
      name: 'Profile',
      component: DevMenuProfile,
      options: applyNavigationSettings(
        DevMenuProfile.navigationOptions,
        this.providedContext.collapse
      ),
    },
  ];

  render() {
    const providedContext = {
      ...this.props,
      ...this.providedContext,
      ...this.state,
    };

    const devMenuScreens = (this.props.devMenuScreens as {
      screenName: string;
      items: any;
    }[]).map(screenInfo => {
      return {
        name: screenInfo.screenName,
        component: DevMenuScreen,
        options: applyNavigationSettings(
          DevMenuScreen.navigationOptions,
          this.providedContext.collapse
        ),
        props: { items: screenInfo.items },
      };
    });

    return (
      <DevMenuContext.Provider value={providedContext}>
        <ApolloProvider client={ApolloClient}>
          <View style={styles.bottomSheetContainer}>
            <TouchableWithoutFeedback onPress={this.collapse}>
              <Animated.View
                style={[styles.bottomSheetBackground, { opacity: this.backgroundOpacity }]}
              />
            </TouchableWithoutFeedback>
            <DevMenuBottomSheet
              animationEnabled={this.state.animationEnabled}
              ref={this.ref}
              initialSnap={0}
              snapPoints={this.snapPoints}
              callbackNode={this.callbackNode}
              screens={[...this.screens, ...devMenuScreens]}
              openScreen={this.props.openScreen}>
              <DevMenuOnboarding show={this.props.showOnboardingView} />
            </DevMenuBottomSheet>
          </View>
          <Animated.Code exec={this.trackCallbackNode} />
        </ApolloProvider>
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
