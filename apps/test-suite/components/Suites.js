import Constants from 'expo-constants';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

import DoneText from './DoneText';
import SuiteResult from './SuiteResult';

export default function Suites({ suites, ...props }) {
  return (
    <FlatList
      inverted
      style={styles.list}
      contentContainerStyle={styles.contentContainerStyle}
      data={[...suites]}
      keyExtractor={item => item.get('result').get('id')}
      renderItem={({ item }) => <SuiteResult r={item} depth={0} />}
      ListHeaderComponent={() => <DoneText {...props} />}
    />
  );
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    padding: 5,
    paddingBottom: Constants.statusBarHeight,
  },
  list: {
    flex: 1,
  },
});
