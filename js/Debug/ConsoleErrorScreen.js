/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ConsoleErrorScreen
 */
'use strict';

import React, { PropTypes } from 'react';
import { ListView, StyleSheet, Text, View } from 'react-native';

import autobind from 'autobind-decorator';
import { connect } from 'react-redux';

import ExColors from 'ExColors';

class ConsoleErrorScreen extends React.Component {
  static propTypes = {
    errorId: PropTypes.number.isRequired,
  };

  static getDataProps(data, props) {
    let consoleHistory = data.console.history;
    return {
      consoleError: consoleHistory.get(props.errorId),
    };
  }

  constructor(props, context) {
    super(props, context);
    let dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
    });
    this.state = {
      dataSource: this._cloneDataSourceWithProps(dataSource, props),
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState(state => ({
      dataSource: this._cloneDataSourceWithProps(state.dataSource, nextProps),
    }));
  }

  _cloneDataSourceWithProps(dataSource, props) {
    let { consoleError } = props;
    return dataSource.cloneWithRows(consoleError.stack.toArray());
  }

  getScrollResponder() {
    return this._listView.getScrollResponder();
  }

  render() {
    if (!this.props.consoleError) {
      return null;
    }

    return (
      <ListView
        ref={component => {
          this._listView = component;
        }}
        dataSource={this.state.dataSource}
        renderHeader={this._renderHeader}
        renderRow={this._renderStackFrame}
        enableEmptySections
        contentContainerStyle={styles.contentContainer}
        initialListSize={10}
        scrollRenderAheadDistance={100}
        style={styles.container}
      />
    );
  }

  @autobind
  _renderHeader() {
    return (
      <View>
        {this._renderErrorMessage()}
        <Text style={styles.stackTraceHeading}>Stack Trace:</Text>
      </View>
    );
  }

  _renderErrorMessage() {
    let { consoleError } = this.props;
    return (
      <Text style={styles.errorHeading}>
        There was an unhandled error:{' '}
        <Text style={styles.errorMessage}>{consoleError.message[0]}</Text>
      </Text>
    );
  }

  @autobind
  _renderStackFrame(frame, rowId, sectionId, highlightRow) {
    let fileName = /[\\/]?([^\\/]*)$/.exec(frame.file)[1];
    return (
      <View key={`frame-${rowId}`} style={styles.stackFrame}>
        <Text style={styles.methodName}>{frame.methodName}</Text>
        <Text style={styles.sourcePosition}>
          {fileName}:{frame.lineNumber}
        </Text>
      </View>
    );
  }
}

export default connect((data, props) => ConsoleErrorScreen.getDataProps(data, props))(
  ConsoleErrorScreen
);

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  errorHeading: {
    fontSize: 17,
  },
  errorMessage: {
    color: ExColors.errorRed,
  },
  stackTraceHeading: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  stackFrame: {
    marginLeft: 6,
    paddingVertical: 4,
  },
  methodName: {
    color: '#000',
    fontSize: 14,
  },
  sourcePosition: {
    color: '#000',
    fontSize: 12,
  },
});
