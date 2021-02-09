import React from 'react';
import { StyleSheet, View } from 'react-native';

import LayoutRuler from '../components/LayoutRuler';

const BOTTOM_PADDING = 40;

type Props = {
  ScreenComponent: React.ComponentType;
};

export default class DevMenuScreen extends React.PureComponent<Props> {
  render() {
    const { ScreenComponent, ...props } = this.props;

    return (
      <View style={[styles.container]}>
        <LayoutRuler property="height">
          <ScreenComponent {...props} />
        </LayoutRuler>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: BOTTOM_PADDING,
  },
});
