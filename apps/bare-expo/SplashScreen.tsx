import * as React from 'react';
import { StyleSheet, Image, View, Text, Dimensions, StatusBar, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const SplashScreenGif = require('./assets/splashscreen-light.gif');

interface State {
  isShowingJSSplashScreen: boolean;
  isShowingNativeSplashScreen: boolean;
}

export default class App extends React.Component<object, State> {
  readonly state: State = {
    isShowingJSSplashScreen: false,
    isShowingNativeSplashScreen: true,
  };

  constructor(props: object) {
    super(props);

    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
    }

    console.log('SplashScreen.preventAutoHideAsync called');
    SplashScreen.preventAutoHideAsync()
      .then(() => console.log('SplashScreen.preventAutoHideAsync returned'))
      .catch(error => console.log(`SplashScreen.preventAutoHideAsync error: ${error}`));
  }

  async componentDidMount() {
    setTimeout(() => {
      console.log('JS SplashScreen phase - starting');
      this.setState({
        isShowingNativeSplashScreen: false,
        isShowingJSSplashScreen: true,
      });
    }, 2000);
  }

  hideNativeSplashScreen = async () => {
    console.log('SplashScreen.hideAsync called');
    SplashScreen.hideAsync()
      .then(() => console.log('SplashScreen.hideAsync returned'))
      .catch(error => console.log(`SplashScreen.hideAsync error: ${error}`));

    setTimeout(async () => {
      console.log('JS SplashScreen phase - ending');
      this.setState({ isShowingJSSplashScreen: false });
    }, 12000);
  };

  render() {
    if (this.state.isShowingNativeSplashScreen) {
      return null;
    }

    if (this.state.isShowingJSSplashScreen) {
      return (
        <View style={styles.container}>
          <Image
            style={styles.splashscreen}
            source={SplashScreenGif}
            resizeMode="cover"
            fadeDuration={0}
            onLoadEnd={this.hideNativeSplashScreen}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.text}>Hello SplashScreen demo!</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#aabbcc',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
  splashscreen: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
