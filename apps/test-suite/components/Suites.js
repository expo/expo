import Constants from 'expo-constants';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

import DoneText from './DoneText';
import SuiteResult from './SuiteResult';

export default function Suites({ suites, ...props }) {
  const ref = React.useRef(null);

  function scrollToEnd() {
    if (ref.current) ref.current.scrollToEnd({ animated: false });
  }

  return (
    <FlatList
      ref={ref}
      style={styles.list}
      contentContainerStyle={styles.contentContainerStyle}
      data={[...suites]}
      keyExtractor={item => item.get('result').get('id')}
      renderItem={({ item }) => <SuiteResult r={item} depth={0} />}
      ListFooterComponent={() => <DoneText {...props} />}
      onContentSizeChange={scrollToEnd}
      onLayout={scrollToEnd}
    />
  );
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    padding: 5,
    paddingBottom: Constants.statusBarHeight || 24,
  },
  list: {
    flex: 1,
  },
});
