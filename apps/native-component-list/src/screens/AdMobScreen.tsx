import {
  requestPermissionsAsync,
  getPermissionsAsync,
  AdMobBanner,
  AdMobInterstitial,
  AdMobRewarded,
  isAvailableAsync,
  setTestDeviceIDAsync,
  PublisherBanner,
} from 'expo-ads-admob';
import * as React from 'react';
import { StyleSheet, Platform, Switch, Text, View, ScrollView } from 'react-native';

import Button from '../components/Button';
import SimpleActionDemo from '../components/SimpleActionDemo';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function AdMobScreen() {
  const [isAvailable, error] = useResolvedValue(isAvailableAsync);

  const warning = React.useMemo(() => {
    if (error) {
      return `An unknown error occurred while checking the API availability: ${error.message}`;
    } else if (isAvailable === null) {
      return 'Checking availability...';
    } else if (isAvailable === false) {
      return 'AdMob API is not available on this platform.';
    }
    return null;
  }, [error, isAvailable]);

  if (warning) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Text>{warning}</Text>
      </View>
    );
  }

  return <AdMobView />;
}

const AdMobBannerTestUnitID = Platform.select({
  // https://developers.google.com/admob/ios/test-ads
  ios: 'ca-app-pub-3940256099942544/2934735716',
  // https://developers.google.com/admob/android/test-ads
  android: 'ca-app-pub-3940256099942544/6300978111',
});

const AdMobInterstitialTestUnitID = Platform.select({
  // https://developers.google.com/admob/ios/test-ads
  ios: 'ca-app-pub-3940256099942544/4411468910',
  // https://developers.google.com/admob/android/test-ads
  android: 'ca-app-pub-3940256099942544/1033173712',
})!;

const AdMobRewardedTestUnitID = Platform.select({
  // https://developers.google.com/admob/ios/test-ads
  ios: 'ca-app-pub-3940256099942544/1712485313',
  // https://developers.google.com/admob/android/test-ads
  android: 'ca-app-pub-3940256099942544/5224354917',
})!;

function AdMobView() {
  const [isInterstitialReady, setInterstitialReady] = React.useState(false);
  const [isRewardedReady, setRewardedReady] = React.useState(false);
  const [servePersonalizedAds, setPersonalizedAds] = React.useState(false);

  React.useEffect(() => {
    setTestDeviceIDAsync('EMULATOR');
    AdMobRewarded.setAdUnitID(AdMobRewardedTestUnitID);
    AdMobInterstitial.setAdUnitID(AdMobInterstitialTestUnitID);
    AdMobRewarded.addEventListener('rewardedVideoDidDismiss', reloadRewarded);
    AdMobInterstitial.addEventListener('interstitialDidClose', reloadInterstitial);
    reloadRewarded();
    reloadInterstitial();

    return () => {
      AdMobRewarded.removeEventListener('rewardedVideoDidDismiss', reloadRewarded);
      AdMobInterstitial.removeEventListener('interstitialDidClose', reloadInterstitial);
    };
  }, []);

  const onPress = () => {
    AdMobRewarded.showAdAsync();
    setRewardedReady(false);
  };

  const onInterstitialPress = () => {
    AdMobInterstitial.showAdAsync();
    setInterstitialReady(false);
  };

  const reloadRewarded = async () => {
    if (!(await AdMobRewarded.getIsReadyAsync())) {
      let isRewardedReady = false;
      try {
        await AdMobRewarded.requestAdAsync({
          servePersonalizedAds,
        });
        isRewardedReady = true;
      } catch (e) {
        if (e.code === 'E_AD_ALREADY_LOADED') {
          isRewardedReady = true;
        } else {
          console.warn('AdMobRewarded.requestAdAsync', e);
        }
      } finally {
        setRewardedReady(isRewardedReady);
      }
    }
  };

  const reloadInterstitial = async () => {
    if (!(await AdMobInterstitial.getIsReadyAsync())) {
      let isInterstitialReady = false;
      try {
        await AdMobInterstitial.requestAdAsync({
          servePersonalizedAds,
        });
        isInterstitialReady = true;
      } catch (e) {
        if (e.code === 'E_AD_ALREADY_LOADED') {
          isInterstitialReady = true;
        } else {
          console.warn('AdMobInterstitial.requestAdAsync', e);
        }
      } finally {
        setInterstitialReady(isInterstitialReady);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContainer}>
      <View style={{ flex: 1 }}>
        <SimpleActionDemo
          title="get tracking permissions"
          action={async () => await getPermissionsAsync()}
        />
        <SimpleActionDemo
          title="request tracking permissions"
          action={async () => await requestPermissionsAsync()}
        />
        <Button
          style={styles.button}
          onPress={onPress}
          title="Show Rewarded Interstitial Ad"
          disabled={!isRewardedReady}
        />
        <Button
          style={styles.button}
          title="Show Interstitial Ad"
          onPress={onInterstitialPress}
          disabled={!isInterstitialReady}
        />
        <AdMobBanner
          onAdViewDidReceiveAd={() => {
            console.log('This should not spam the console.');
          }}
          bannerSize="largeBanner"
          adUnitID={AdMobBannerTestUnitID}
        />
        <PublisherBanner bannerSize="largeBanner" adUnitID={AdMobBannerTestUnitID} />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 16,
          }}>
          <Text>Load personalized ads</Text>
          <Switch value={servePersonalizedAds} onValueChange={setPersonalizedAds} />
        </View>
      </View>
    </ScrollView>
  );
}

AdMobScreen.navigationOptions = {
  title: 'AdMob',
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
  },
  scrollViewContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 15,
  },
  button: {
    marginVertical: 10,
  },
});
