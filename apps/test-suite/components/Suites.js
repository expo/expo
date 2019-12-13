import Constants from 'expo-constants';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

import DoneText from './DoneText';
import SuiteResult from './SuiteResult';

export default function Suites({ suites, ...props }) {
  const ref = React.useRef(null);

  const renderItem = ({ item }) => <SuiteResult r={item} depth={0} />;

  const keyExtractor = item => item.get('result').get('id');

  const scrollToEnd = React.useMemo(() => {
    if (ref.current) ref.current.scrollToEnd({ animated: false });
  }, [ref]);

  const ListFooterComponent = () => (
    <DoneText done={props.done} numFailed={props.numFailed} results={props.results} />
  );

  return (
    <FlatList
      ref={ref}
      style={styles.list}
      contentContainerStyle={styles.contentContainerStyle}
      data={[...suites]}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListFooterComponent={ListFooterComponent}
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
