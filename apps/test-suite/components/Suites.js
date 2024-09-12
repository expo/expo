import Constants from 'expo-constants';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import DoneText from './DoneText';
import SuiteResult from './SuiteResult';
import { useTheme } from '../../common/ThemeProvider';

export default function Suites({ suites, done, numFailed, results }) {
  const ref = React.useRef(null);
  const { theme } = useTheme();

  return (
    <FlatList
      ref={ref}
      style={styles.list}
      contentContainerStyle={styles.contentContainerStyle}
      data={[...suites]}
      keyExtractor={(item) => item.get('result').get('id')}
      renderItem={({ item }) => <SuiteResult r={item} depth={0} />}
      ListHeaderComponent={() => (
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: theme.background.default,
              borderBottomColor: theme.border.secondary,
            },
          ]}>
          <DoneText done={done} numFailed={numFailed} results={results} />
        </View>
      )}
      stickyHeaderIndices={[0]}
    />
  );
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    paddingBottom: (Constants.statusBarHeight || 24) + 128,
  },
  list: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
