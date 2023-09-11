import { StackNavigationProp } from '@react-navigation/stack';
import * as StoreReview from 'expo-store-review';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Colors from '../constants/Colors';

type Props = {
  navigation: StackNavigationProp<any>;
};

function getStoreUrlInfo(): string {
  const storeUrl = StoreReview.storeUrl();
  if (storeUrl) {
    return `On Android devices pressing this button will open ${storeUrl}.`;
  }
  return 'You will need to add ios.appStoreUrl, and android.playStoreUrl to your app.config.js in order to use this feature on Android.';
}

function StoreReviewScreen({ navigation }: Props) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Store Review',
    });
  }, [navigation]);

  const [isAvailable, setAvailable] = React.useState<boolean>(false);

  React.useEffect(() => {
    StoreReview.isAvailableAsync().then(setAvailable);
  }, []);

  const isSupportedText = isAvailable ? 'is available' : 'is not available!';

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.isSupportedText}>Native Store Review {isSupportedText}</Text>
        <Text style={styles.description}>{getStoreUrlInfo()}</Text>
      </View>

      <Button
        onPress={StoreReview.requestReview}
        style={styles.button}
        buttonStyle={!StoreReview.hasAction() ? styles.disabled : undefined}
        title="Request a Review!"
      />

      <View style={[styles.textContainer, { marginTop: 5 }]}>
        <Text style={styles.description}>
          {Platform.OS === 'android' && 'Warning: this will not work in unsigned APKs'}
        </Text>
      </View>
    </View>
  );
}
StoreReviewScreen.navigationOptions = { title: 'Store Review' };

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  textContainer: {
    marginBottom: 16,
  },
  isSupportedText: {
    color: Colors.tintColor,
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    color: Colors.secondaryText,
    fontSize: 14,
  },
  disabled: {
    backgroundColor: Colors.disabled,
  },
  button: {
    alignItems: 'flex-start',
  },
});

export default StoreReviewScreen;
