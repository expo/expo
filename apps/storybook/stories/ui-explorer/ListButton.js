import React from 'react';
import { PixelRatio, StyleSheet, Text, TouchableHighlight, View } from 'react-native';

const TITLE = 'ScreenOrientation';

export default class ListButton extends React.Component {
  render() {
    const style = [styles.button];
    const labelStyles = [styles.label];
    if (this.props.disabled) {
      style.push(styles.disabledButton);
      labelStyles.push(styles.disabledLabel);
    }
    return (
      <View style={[styles.container, this.props.style]}>
        <TouchableHighlight
          style={style}
          disabled={this.props.disabled}
          onPress={this.props.onPress}
          underlayColor="#dddddd">
          <Text style={labelStyles}>{this.props.title}</Text>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {},
  button: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
  disabledButton: {},
  label: {
    color: 'blue',
    fontWeight: '700',
  },
  disabledLabel: {
    color: '#999999',
  },
});
