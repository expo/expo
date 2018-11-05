import React from 'react';
import { StyleSheet, View, NativeModules, Platform } from 'react-native';
import { AdMobBanner, AdMobRewarded, AdMobInterstitial } from 'expo';
import Button from '../components/Button';
import { Colors } from '../constants';

export default class AdMobScreen extends React.Component {
  static navigationOptions = {
    title: 'AdMob',
  };

  constructor() {
    super();
    AdMobRewarded.setTestDeviceID('EMULATOR');
    AdMobRewarded.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
    AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
    AdMobInterstitial.setTestDeviceID('EMULATOR');
  }

  componentDidMount() {
    AdMobRewarded.requestAdAsync(error => error && console.log(error));
    AdMobInterstitial.requestAdAsync(error => error && console.log(error));
  }

  onPress() {
    AdMobRewarded.showAdAsync(error => error && console.log(error));
  }

  onInterstitialPress() {
    AdMobInterstitial.showAdAsync(error => error && console.log(error));
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <Button style={styles.button} onPress={this.onPress} title="Show Rewarded Interstitial Ad" />
          <Button style={styles.button} onPress={this.onInterstitialPress} title="Show Interstitial Ad" />
          <AdMobBanner
            bannerSize="banner"
            adUnitID="ca-app-pub-3940256099942544/6300978111"
            testDeviceID="EMULATOR"
            didFailToReceiveAdWithError={this.bannerError}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 30 : 30,
    flex: 1,
    alignItems: 'center',
  },
  button: {
    marginVertical: 10,
  },
});
