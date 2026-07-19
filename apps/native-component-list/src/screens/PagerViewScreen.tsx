import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

export default function PagerViewScreen() {
  return (
    <PagerView
      style={styles.container}
      initialPage={0}
      onPageSelected={(_) => {
        console.log('New page!');
      }}>
      <View key="1" style={styles.page}>
        <Text style={styles.text}>First page</Text>
        <Text style={styles.description}>Swipe this to scroll to the next page</Text>
      </View>
      <View key="2" style={styles.page}>
        <Text style={styles.text}>Second page</Text>
        <Text style={styles.description}>Swipe this to scroll back</Text>
      </View>
    </PagerView>
  );
}

PagerViewScreen.navigationOptions = {
  title: 'PagerView Example',
  gesturesEnabled: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#888',
  },
});
