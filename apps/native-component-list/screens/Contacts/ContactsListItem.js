import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Colors from '../../constants/Colors';

export default class ContactsListItem extends React.PureComponent {
  onPress = () => {
    this.props.onPress && this.props.onPress(this.props.contactId);
  };
  render() {
    const { name, subtitle, isMe } = this.props;
    return (
      <TouchableHighlight underlayColor={Colors.listItemTouchableHighlight} onPress={this.onPress}>
        <View style={styles.container}>
          <View>
            <Text style={styles.title}>{name}</Text>
            {subtitle && <Text style={styles.link}>{subtitle}</Text>}
          </View>
          {isMe && <Text style={styles.subtitle}>me</Text>}
          <Ionicons size={24} color={Colors.tabIconDefault} name="ios-arrow-forward" />
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
  },
  link: {
    color: Colors.tintColor,
  },
  subtitle: {
    opacity: 0.8,
  },
});
