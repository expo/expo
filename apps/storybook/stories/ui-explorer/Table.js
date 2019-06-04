/**
 * Created by Jeepeng on 2016/11/20.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const DEFAULT_HEIGHT = 240;
const DEFAULT_COLUMN_WIDTH = 60;

export default class Table extends Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        dataIndex: PropTypes.string.isRequired,
        width: PropTypes.number,
      })
    ).isRequired,
    columnWidth: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.array.isRequired,
    renderCell: PropTypes.func,
  };

  static defaultProps = {
    columns: [],
    data: [],
    columnWidth: DEFAULT_COLUMN_WIDTH,
    height: DEFAULT_HEIGHT,
    renderCell: undefined,
  };

  _renderCell = (cellData, col) => {
    let style = {
      // width: col.width || this.props.columnWidth || DEFAULT_COLUMN_WIDTH
    };

    let contents = cellData;
    if (Array.isArray(cellData)) {
      contents = cellData.join(' | ');
    }
    return (
      <View key={col.dataIndex} style={[styles.cell, style]}>
        <Text>{contents}</Text>
      </View>
    );
  };

  _renderHeader() {
    let { columns, columnWidth } = this.props;
    return columns.map((col, index) => {
      let style = {
        //   width: col.width || columnWidth || DEFAULT_COLUMN_WIDTH
      };
      return (
        <View key={index} style={[styles.headerItem, styles.flex, style]}>
          <Text>{col.title}</Text>
        </View>
      );
    });
  }

  _renderRow(rowData, index) {
    let { columns, renderCell } = this.props;
    if (!renderCell) {
      renderCell = this._renderCell;
    }
    console.log('Render row: ', rowData);
    return (
      <View key={index} style={[styles.row, styles.flex]}>
        {columns.map(col => renderCell(rowData[col.dataIndex], col))}
      </View>
    );
  }

  render() {
    let { data, height } = this.props;
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { height }]}
        horizontal={true}
        bounces={false}>
        <View>
          <View style={[styles.header, styles.flex]}>{this._renderHeader()}</View>
          <ScrollView
            style={[styles.dataView, styles.flex]}
            contentContainerStyle={styles.dataViewContent}>
            {data.map((rowData, index) => this._renderRow(rowData, index))}
          </ScrollView>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {},
  flex: {
    // flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  contentContainer: {
    height: 240,
  },
  header: {
    flexDirection: 'row',
  },
  headerItem: {
    minHeight: 30,
    minWidth: DEFAULT_COLUMN_WIDTH,
    flex: 1,
    backgroundColor: '#efefef',
    borderRightWidth: 1,
    borderRightColor: '#dfdfdf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataView: {
    flexGrow: 1,
  },
  dataViewContent: {},
  row: {
    flexDirection: 'row',
    backgroundColor: '#fbfbfb',
    borderBottomWidth: 1,
    borderBottomColor: '#dfdfdf',
  },
  cell: {
    minHeight: 25,
    minWidth: DEFAULT_COLUMN_WIDTH,
    flex: 1,
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: '#dfdfdf',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
