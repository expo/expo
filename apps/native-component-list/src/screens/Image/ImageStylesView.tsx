import * as React from 'react';
import { StyleSheet, Animated, Text } from 'react-native';

import { Colors } from '../../constants';
import { resolveProps } from './resolveProps';
import { ImageTest } from './types';

type PropsType = {
  test: ImageTest;
  animValue?: Animated.Value;
};

export default class ImageStylesView extends React.Component<PropsType> {
  listenerId?: string = undefined;

  componentDidMount() {
    const { animValue } = this.props;
    // @ts-ignore
    if (animValue && !animValue.__isNative) {
      this.listenerId = animValue.addListener(() => this.forceUpdate());
    }
  }

  componentWillUnmount() {
    const { animValue } = this.props;
    if (this.listenerId && animValue) {
      animValue.removeListener(this.listenerId);
      this.listenerId = undefined;
    }
  }

  componentDidUpdate(prevProps: PropsType) {
    const { animValue } = this.props;
    if (animValue !== prevProps.animValue) {
      if (this.listenerId && prevProps.animValue) {
        prevProps.animValue.removeListener(this.listenerId);
        this.listenerId = undefined;
      }
      // @ts-ignore
      if (animValue && !animValue.__isNative) {
        this.listenerId = animValue.addListener(() => this.forceUpdate());
      }
    }
  }

  render() {
    const { test, animValue } = this.props;
    let displayStyles = JSON.stringify(resolveProps(test.props, animValue, true), undefined, 2);
    displayStyles = displayStyles.substring(2, displayStyles.length - 2);
    return <Text style={styles.container}>{displayStyles}</Text>;
  }
}

const styles = StyleSheet.create({
  container: {
    fontSize: 13,
    fontFamily: 'Courier',
    color: Colors.secondaryText,
  },
});
