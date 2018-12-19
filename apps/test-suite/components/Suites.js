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

  _renderSuiteResult = (r, depth) => {
    const result = r.get('result');
    const id = result.get('id');
    const description = result.get('description');
    const specs = r.get('specs');
    const children = r.get('children');

    return (
      <SuiteResult
        key={id}
        id={id}
        description={description}
        specs={specs}
        children={children}
        depth={depth}
      />
    );
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
        {suites.map(r => this._renderSuiteResult(r, 0))}
      </ScrollView>
    );
  }
}
