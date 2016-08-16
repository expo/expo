/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ConsoleHistoryScreen
 */
'use strict';

import React from 'react';
import {
  ListView,
  NativeModules,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

import autobind from 'autobind-decorator';
import moment from 'moment';
import util from 'react-native-util';
import { connect } from 'react-redux';

import ConsoleRouter from 'ConsoleRouter';
import ExColors from 'ExColors';
import ExLayout from 'ExLayout';

const { ExponentKernel } = NativeModules;

const KERNEL_ROUTE_ERROR = 2;

class ConsoleHistoryScreen extends React.Component {
  static getDataProps(data) {
    return {
      consoleHistory: data.console.history,
    };
  }

  constructor(props, context) {
    super(props, context);

    let dataSource = new ListView.DataSource({
      rowHasChanged: (oldRow, newRow) => oldRow !== newRow,
      getRowData: (data, sectionId, rowId) => {
        return data[sectionId].get(rowId);
      },
    });

    this.state = {
      dataSource: this._cloneDataSourceWithProps(dataSource, props),
      hasDismissedOverlay: false,
    };
  }

  componentWillMount() {
    if (ExponentKernel.routeDidForeground) {
      ExponentKernel.routeDidForeground(KERNEL_ROUTE_ERROR, null);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState(state => ({
      dataSource: this._cloneDataSourceWithProps(state.dataSource, nextProps),

      // reset overlay state-- if another error happens that's user facing,
      // they'll see the message again.
      hasDismissedOverlay: false,
    }));
  }

  _cloneDataSourceWithProps(dataSource, props) {
    let history = props.consoleHistory;
    let historyIds = history.keySeq().reverse().toArray();
    return dataSource.cloneWithRows(history, historyIds);
  }

  render() {
    if (this.props.isUserFacing && !this.state.hasDismissedOverlay) {
      // show user-facing message explaining the problem
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Something went wrong while showing this experience. To continue, refresh or load a different experience.
          </Text>
          <TouchableOpacity onPress={this._onDismissOverlay}>
            <Text style={styles.showDetailsButton}>
              Show Details
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else if (this.props.consoleHistory && this.props.consoleHistory.size > 0) {
      // show the normal console
      return (
        <ListView
          ref={component => { this._listView = component; }}
          enableEmptySections
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          renderSeparator={this._renderSeparator}
          style={styles.container}
        />
      );
    } else {
      // show an empty console message
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            The console is empty. Developer information about the current experience, such as uncaught issues, will appear here.
          </Text>
        </View>
      );
    }
  }

  @autobind
  _renderRow(rowData, sectionId, rowId, highlightRow) {
    let message = util.format(...rowData.message);
    let timestamp = moment(rowData.time).format('h:mm:ss');

    let stack = rowData.stack;
    if (stack.size) {
      let frame = stack.first();
      let fileName = /[\\/]?([^\\/]*)$/.exec(frame.file)[1];
      if (fileName.match(/\w+\.bundle\?/)) {
        fileName = '';
      } else {
        fileName = '@' + fileName;
      }
      var stackTracePreview =
        <Text>
          {frame.methodName}{fileName}:{frame.lineNumber}
        </Text>;
    }

    if (rowData.fatal) {
      var fatalNotice =
        <Text>
          {' '}Fatal Error
        </Text>;
    }

    return (
      <TouchableHighlight
        key={rowData.id}
        activeOpacity={1}
        underlayColor={ExColors.selectedRow}
        onPressIn={() => highlightRow(sectionId, rowId)}
        onPressOut={() => highlightRow(null)}
        onPress={() => this._presentError(rowId)}>
        <View style={styles.row}>
          <Text style={styles.errorMessage}>
            Uncaught Error: {message}
          </Text>
          {stackTracePreview}
          <Text style={styles.metadata}>
            <Text style={styles.timestamp}>
              Time: {timestamp}
            </Text>
            {fatalNotice}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }

  @autobind
  _renderSeparator(sectionId, rowId, adjacentRowSelected) {
    let style = adjacentRowSelected ?
      [styles.separator, styles.selectedSeparator] :
      styles.separator;
    return <View key={`sep-${sectionId}-${rowId}`} style={style} />;
  }

  @autobind
  _onDismissOverlay() {
    this.setState({ hasDismissedOverlay: true });
  }

  _presentError(errorId) {
    let { navigator } = this.props;
    navigator.push(ConsoleRouter.getConsoleErrorRoute(errorId));
  }
}

export default connect(
  data => ConsoleHistoryScreen.getDataProps(data),
)(ConsoleHistoryScreen);

let styles = StyleSheet.create({
  container: {
  },
  row: {
    overflow: 'hidden',
    padding: 10,
  },
  separator: {
    height: ExLayout.pixel,
    marginLeft: 10,
    backgroundColor: ExColors.rowSeparator,
  },
  selectedSeparator: {
    backgroundColor: ExColors.selectedRow,
  },
  errorMessage: {
    color: ExColors.errorRed,
  },
  metadata: {
    color: ExColors.grayText,
    fontSize: 12,
  },
  timestamp: {
  },
  emptyContainer: {
    paddingHorizontal: 32,
    marginTop: 16,
  },
  emptyText: {
    color: ExColors.grayText,
  },
  showDetailsButton: {
    color: 'blue',
    alignSelf: 'center',
    marginVertical: 12,
  },
});
