import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import LayoutRuler from '../components/LayoutRuler';

const BOTTOM_PADDING = 40;

type Props = {
  ScreenComponent: React.ComponentType;
};

export default class DevMenuScreen extends React.PureComponent<Props> {
  containerHeightValue = new Animated.Value<number>(10000);
  heightSet = false;

  onHeightMeasure = (height: number) => {
    console.log(this.props.ScreenComponent.name, height);

    if (!this.heightSet && height > 0) {
      this.containerHeightValue.setValue(height + BOTTOM_PADDING);
      this.heightSet = true;
    }
  };

  render() {
    const { ScreenComponent, ...props } = this.props;

    return (
      <Animated.View style={[styles.container, { height: this.containerHeightValue }]}>
        <LayoutRuler property="height" onMeasure={this.onHeightMeasure}>
          <ScreenComponent {...props} />
        </LayoutRuler>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: BOTTOM_PADDING,
  },
});
