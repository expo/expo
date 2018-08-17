import { StoreReview } from 'expo';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import CannyFooter from '../components/CannyFooter';
import Colors from '../constants/Colors';

class StoreReviewScreen extends React.Component {
  static navigationOptions = {
    title: 'Store Review',
  };

  onRequestReview = () => StoreReview.requestReview();

  get isSupportedText() {
    return StoreReview.isSupported() ? 'is supported! :D' : 'is not supported! D:';
  }

  get storeUrl() {
    const storeUrl = StoreReview.storeUrl();
    if (storeUrl) {
      return `On iOS <10.3, or Android devices pressing this button will open ${storeUrl}.`;
    } else {
      return `You will need to add ios.appStoreUrl, and android.playStoreUrl to your app.json in order to use this feature.`;
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View>
          <View style={styles.textContainer}>
            <Text style={styles.isSupportedText}>Native Store Review {this.isSupportedText}</Text>
            <Text style={styles.storeUrlText}>{this.storeUrl}</Text>
          </View>

          <Button
            onPress={this.onRequestReview}
            style={styles.button}
            buttonStyle={!StoreReview.hasAction() && styles.disabled}
            title="Request a Review!"
          />
        </View>

        <CannyFooter />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: Colors.greyBackground,
    justifyContent: 'space-between',
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
  storeUrlText: {
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
