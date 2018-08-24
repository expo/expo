import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Colors from '../../constants/Colors';

export default class ContactDetailListItem extends React.PureComponent {
  onPress = () => {
    this.props.onPress && this.props.onPress(this.props);
  };
  render() {
    const { label, value, onPress } = this.props;
    return (
      <TouchableHighlight
        disabled={!onPress}
        underlayColor={Colors.listItemTouchableHighlight}
        onPress={this.onPress}>
        <View style={styles.container}>
          <View style={{ maxWidth: '80%' }}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.link}>{value}</Text>
          </View>
          {onPress && <Ionicons size={24} color={Colors.tabIconDefault} name="ios-arrow-forward" />}
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
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
