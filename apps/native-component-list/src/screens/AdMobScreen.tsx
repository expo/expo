import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { AdMobBanner, AdMobInterstitial, AdMobRewarded } from 'expo-ads-admob';
import Button from '../components/Button';

export default class AdMobScreen extends React.Component {
  static navigationOptions = {
    title: 'AdMob',
  };

  constructor(props: object) {
    super(props);
    AdMobRewarded.setTestDeviceID('EMULATOR');
    AdMobRewarded.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
    AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
    AdMobInterstitial.setTestDeviceID('EMULATOR');
  }

  componentDidMount() {
    AdMobRewarded.requestAdAsync();
    AdMobInterstitial.requestAdAsync();
  }

  onPress() {
    AdMobRewarded.showAdAsync();
  }

  onInterstitialPress() {
    AdMobInterstitial.showAdAsync();
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <Button
            style={styles.button}
            onPress={this.onPress}
            title="Show Rewarded Interstitial Ad"
          />
          <Button
            style={styles.button}
            onPress={this.onInterstitialPress}
            title="Show Interstitial Ad"
          />
          <AdMobBanner
            bannerSize="banner"
            adUnitID="ca-app-pub-3940256099942544/6300978111"
            testDeviceID="EMULATOR"
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
