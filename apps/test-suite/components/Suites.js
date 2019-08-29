import Constants from 'expo-constants';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import useDimensions from '../utils/useDimensions';
import SuiteResult from './SuiteResult';

function DoneText({ done, numFailed, results }) {
  if (!done) {
    return null;
  }
  return (
    <View testID="test_suite_results">
      <Text testID="test_suite_text_results" style={styles.doneMessage}>
        All done! {numFailed}
        {numFailed === 1 ? ' test' : ' tests'} failed.
      </Text>
      <Text
        style={{ position: 'absolute', opacity: 0 }}
        pointerEvents="none"
        testID="test_suite_final_results">
        {results}
      </Text>
    </View>
  );
}

export default function Suites({ suites, ...props }) {
  const scrollView = React.useRef(null);
  const {
    window: { height },
  } = useDimensions();

  const onContentSizeChange = (contentWidth, contentHeight) => {
    if (!scrollView.current) {
      return;
    }
    scrollView.current.scrollTo({
      y: Math.max(0, contentHeight - height) + Constants.statusBarHeight,
    });
  };

  return (
    <ScrollView
      style={{
        flex: 1,
      }}
      contentContainerStyle={styles.contentContainerStyle}
      ref={scrollView}
      onContentSizeChange={onContentSizeChange}>
      {suites.map(r => (
        <SuiteResult key={r.get('result').get('id')} r={r} depth={0} />
      ))}
      <DoneText {...props} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  doneMessage: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
  contentContainerStyle: {
    padding: 5,
    paddingBottom: Constants.statusBarHeight,
  },
});
