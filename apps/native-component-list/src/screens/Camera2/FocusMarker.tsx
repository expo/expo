import * as React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

import { FocusMarkerIcon, BrightnessRulerIcon } from './icons';

const SIZE = 80;

interface Props extends ViewProps {
  point: { x: number, y: number };
  showBrightnessRuler?: boolean;
  /**
   * From `-1.0` to `1.0`
   */
  brightnessIndicator?: number;
}

export default class FocusMarker extends React.PureComponent<Props> {
  render() {
    const { point: { x, y }, showBrightnessRuler } = this.props;
    return (
      <View {...this.props} style={[this.props.style, { left: x - SIZE / 2, top: y - SIZE / 2 }]}>
        <View style={styles.relativeContainer}>
          <FocusMarkerIcon size={SIZE}/>
          {showBrightnessRuler && (
            <BrightnessRulerIcon style={styles.brightnessRuler} brightnessIndicator={this.props.brightnessIndicator || 0} />
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  relativeContainer: {
    position: 'relative'
  },
  brightnessRuler: {
    position: 'absolute',
    right: -20,
  },
});
