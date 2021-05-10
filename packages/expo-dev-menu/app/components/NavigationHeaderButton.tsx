import React from 'react';
import { StyleSheet, Animated, View } from 'react-native';

import { TouchableOpacity } from './Touchables';

type Props = {
  onPress?: () => void;
};

export default class NavigationHeaderButton extends React.PureComponent<Props, object> {
  render() {
    return (
      <TouchableOpacity style={styles.container} {...this.props}>
        <View style={styles.labelWrapper}>
          <Animated.Text accessible={false} style={[styles.label]} numberOfLines={1}>
            Back
          </Animated.Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    // Title and back label are a bit different width due to title being bold
    // Adjusting the letterSpacing makes them coincide better
    letterSpacing: 0.35,
    color: 'rgb(0, 122, 255)',
  },
  labelWrapper: {
    // These styles will make sure that the label doesn't fill the available space
    // Otherwise it messes with the measurement of the label
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
