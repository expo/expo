// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';
import PureContainer from './PureContainer';

type Layout = {
  width: number,
  height: number,
};

type LayoutEvent = {
  nativeEvent: {
    layout: Layout,
  },
};

type Renderer = (layout: Layout, key: number) => any;

type Props = {
  children?: any,
};

type State = {
  modals: Array<{ key: number, renderer: Renderer }>,
  layout: {
    measured: boolean,
  } & Layout,
};

export const channel = '__$expo_modal_host';

export default class ModalHost extends Component<Props, State> {
  static childContextTypes = {
    [channel]: PropTypes.object,
  };

  state = {
    modals: [],
    layout: {
      height: 0,
      width: 0,
      measured: false,
    },
  };

  getChildContext() {
    return {
      [channel]: {
        register: this._register,
      },
    };
  }

  _currentKey = 0;

  _register = (renderer: Renderer) => {
    const key = this._currentKey;

    this._currentKey++;
    this.setState(state => ({
      modals: [...state.modals, { key, renderer }],
    }));

    const update = (r: Renderer) =>
      this.setState(state => ({
        modals: state.modals.map(m => (m.key === key ? { key, renderer: r } : m)),
      }));

    const remove = () =>
      this.setState(state => ({
        modals: state.modals.filter(m => m.key !== key),
      }));

    return {
      update,
      remove,
    };
  };

  _handleLayout = (e: LayoutEvent) => {
    const { layout } = e.nativeEvent;
    if (layout.height !== this.state.layout.height || layout.width !== this.state.layout.width) {
      this.setState({ layout: { ...e.nativeEvent.layout, measured: true } });
    }
  };

  render() {
    return (
      <View style={styles.host} onLayout={this._handleLayout}>
        <PureContainer {...this.props}>{this.props.children}</PureContainer>
        {this.state.layout.measured
          ? this.state.modals.map(({ key, renderer }) => {
              return renderer(this.state.layout, key);
            })
          : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
