import { Constants } from 'expo';
import React from 'react';
import { Dimensions, ScrollView } from 'react-native';

import SuiteResult from './SuiteResult';

export default class Suites extends React.Component {
  _scrollViewRef = null;

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
        }}
        ref={ref => (this._scrollViewRef = ref)}
        onContentSizeChange={this._onScrollViewContentSizeChange}>
        {suites.map(r => (
          <SuiteResult key={r.get('result').get('id')} r={r} depth={0} />
        ))}
      </ScrollView>
    );
  }
}
