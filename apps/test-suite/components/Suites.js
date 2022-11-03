import Constants from 'expo-constants';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

import DoneText from './DoneText';
import SuiteResult from './SuiteResult';

export default function Suites({ suites, done, numFailed, results }) {
  const ref = React.useRef(null);

  const renderItem = ({ item }) => <SuiteResult r={item} depth={0} />;

  const keyExtractor = (item) => item.get('result').get('id');

  const scrollToEnd = React.useMemo(
    () => () => {
      if (ref.current && ref.current.props.data.length > 0)
        ref.current.scrollToEnd({ animated: false });
    },
    [ref]
  );

  React.useEffect(() => {
    if (done && ref.current) {
      scrollToEnd();
    }
  }, [ref, done]);

  const ListFooterComponent = () => (
    <DoneText done={done} numFailed={numFailed} results={results} />
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
    paddingBottom: (Constants.statusBarHeight || 24) + 128,
  },
  list: {
    flex: 1,
  },
});
