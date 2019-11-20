import Constants from 'expo-constants';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import useDimensions from '../utils/useDimensions';
import DoneText from './DoneText';
import SuiteResult from './SuiteResult';

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
  contentContainerStyle: {
    padding: 5,
    paddingBottom: Constants.statusBarHeight,
  },
});
