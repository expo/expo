import Image from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default class ExpoImageScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Expo Image Example',
  };

  render() {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Image
          style={{ width: 100, height: 100 }}
          source={{ uri: 'https://d30j33t1r58ioz.cloudfront.net/static/guides/sdk.png' }}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
