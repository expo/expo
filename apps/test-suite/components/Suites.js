import Constants from 'expo-constants';
import React from 'react';
import { Dimensions, View, StyleSheet, Text, ScrollView } from 'react-native';

import SuiteResult from './SuiteResult';

export default class Suites extends React.Component {
  _scrollViewRef = null;

  _renderDoneText = () => {
    if (this.props.done) {
      return (
        <View testID="test_suite_results">
          <Text testID="test_suite_text_results" style={styles.doneMessage}>
            All done! {this.props.numFailed}
            {this.props.numFailed === 1 ? ' test' : ' tests'} failed.
          </Text>
          <Text
            style={{ position: 'absolute', opacity: 0 }}
            pointerEvents="none"
            testID="test_suite_final_results">
            {this.props.results}
          </Text>
        </View>
      );
    }
  };

  _onScrollViewContentSizeChange = (contentWidth, contentHeight) => {
    if (this._scrollViewRef) {
      this._scrollViewRef.scrollTo({
        y: Math.max(0, contentHeight - Dimensions.get('window').height) + Constants.statusBarHeight,
      });
    }
  };

  render() {
    const { suites } = this.props;

    return (
      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          padding: 5,
          paddingBottom: Constants.statusBarHeight,
        }}
        ref={ref => (this._scrollViewRef = ref)}
        onContentSizeChange={this._onScrollViewContentSizeChange}>
        {suites.map(r => (
          <SuiteResult key={r.get('result').get('id')} r={r} depth={0} />
        ))}
        {this._renderDoneText()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  doneMessage: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
