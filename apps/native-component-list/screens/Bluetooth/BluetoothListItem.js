import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Colors from '../../constants/Colors';

export default class BluetoothListItem extends React.PureComponent {
  onPress = () => {
    this.props.onPress && this.props.onPress(this.props);
  };
  render() {
    const { title, values, value, renderAction, onPress } = this.props;
    const valuesToRender = values || [value];
    const hasSubtitle = valuesToRender && valuesToRender.length && valuesToRender[0] !== undefined;
    return (
      <TouchableHighlight
        disabled={!onPress}
        underlayColor={Colors.listItemTouchableHighlight}
        onPress={this.onPress}>
        <View style={styles.container}>
          <View
            style={{
              maxWidth: '80%',
            }}>
            <Text
              style={[
                styles.title,
                {
                  marginBottom: hasSubtitle ? 4 : 0,
                  fontSize: hasSubtitle ? 14 : 18,
                },
              ]}>
              {title}
            </Text>
            {hasSubtitle &&
              valuesToRender.map((value, index) => (
                <Text key={`value-${index}-${value}`} style={styles.link}>
                  {value}
                </Text>
              ))}
          </View>
          {onPress && !renderAction && <ArrowIcon />}
          {renderAction && renderAction()}
        </View>
      </TouchableHighlight>
    );
  }
}

const ArrowIcon = () => (
  <Ionicons size={24} color={Colors.tabIconDefault} name="ios-arrow-forward" />
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    color: Colors.tintColor,
  },
  subtitle: {
    opacity: 0.8,
  },
});
