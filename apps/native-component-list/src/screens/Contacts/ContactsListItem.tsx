import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Colors from '../../constants/Colors';

export default function ContactsListItem(props: {
  contactId: string;
  name: string;
  subtitle?: string;
  isMe?: boolean;
  onPress: (contactId: string) => void;
}) {
  const onPress = () => {
    props.onPress && props.onPress(props.contactId);
  };

  const { name, subtitle, isMe } = props;
  return (
    <TouchableHighlight underlayColor={Colors.listItemTouchableHighlight} onPress={onPress}>
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>{name}</Text>
          {subtitle && <Text style={styles.link}>{subtitle}</Text>}
        </View>
        {isMe && <Text style={styles.subtitle}>me</Text>}
        <Ionicons size={24} color={Colors.tabIconDefault} name="arrow-forward" />
      </View>
    </TouchableHighlight>
  );
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
