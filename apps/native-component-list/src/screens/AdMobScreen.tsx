import {
  AdMobBanner,
  AdMobInterstitial,
  AdMobRewarded,
  setTestDeviceIDAsync,
} from 'expo-ads-admob';
import React from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../components/Button';

export default class AdMobScreen extends React.Component {
  static navigationOptions = {
    title: 'AdMob',
  };

  state = {
    isInterstitialReady: false,
    isRewardedReady: false,
    servePersonalizedAds: false,
  };

  constructor(props: object) {
    super(props);
    setTestDeviceIDAsync('EMULATOR');
    AdMobRewarded.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
    AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
  }

  componentDidMount() {
    AdMobRewarded.addEventListener('rewardedVideoDidClose', this.reloadRewarded);
    AdMobInterstitial.addEventListener('interstitialDidClose', this.reloadInterstitial);
    this.reloadRewarded();
    this.reloadInterstitial();
  }

  componentWillUnmount() {
    AdMobRewarded.removeEventListener('rewardedVideoDidClose', this.reloadRewarded);
    AdMobInterstitial.removeEventListener('interstitialDidClose', this.reloadInterstitial);
  }

  onPress = () => {
    AdMobRewarded.showAdAsync();
    this.setState({ isRewardedReady: false });
  };

  onInterstitialPress = () => {
    AdMobInterstitial.showAdAsync();
    this.setState({ isInterstitialReady: false });
  };

  reloadRewarded = async () => {
    if (!(await AdMobRewarded.getIsReadyAsync())) {
      let isRewardedReady = false;
      try {
        await AdMobRewarded.requestAdAsync({
          servePersonalizedAds: this.state.servePersonalizedAds,
        });
        isRewardedReady = true;
      } catch (e) {
        if (e.code === 'E_AD_ALREADY_LOADED') {
          isRewardedReady = true;
        } else {
          console.warn('AdMobRewarded.requestAdAsync', e);
        }
      } finally {
        this.setState({ isRewardedReady });
      }
    }
  };

  reloadInterstitial = async () => {
    if (!(await AdMobInterstitial.getIsReadyAsync())) {
      let isInterstitialReady = false;
      try {
        await AdMobInterstitial.requestAdAsync({
          servePersonalizedAds: this.state.servePersonalizedAds,
        });
        isInterstitialReady = true;
      } catch (e) {
        if (e.code === 'E_AD_ALREADY_LOADED') {
          isInterstitialReady = true;
        } else {
          console.warn('AdMobInterstitial.requestAdAsync', e);
        }
      } finally {
        this.setState({ isInterstitialReady });
      }
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <Button
            style={styles.button}
            onPress={this.onPress}
            title="Show Rewarded Interstitial Ad"
            disabled={!this.state.isRewardedReady}
          />
          <Button
            style={styles.button}
            title="Show Interstitial Ad"
            onPress={this.onInterstitialPress}
            disabled={!this.state.isInterstitialReady}
          />
          <AdMobBanner bannerSize="banner" adUnitID="ca-app-pub-3940256099942544/6300978111" />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 16,
            }}>
            <Text>Load personalized ads</Text>
            <Switch
              value={this.state.servePersonalizedAds}
              onValueChange={servePersonalizedAds => this.setState({ servePersonalizedAds })}
            />
          </View>
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
