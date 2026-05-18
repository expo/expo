import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { StyleSheet, TouchableHighlight, View } from 'react-native';

import Colors from '../../constants/Colors';
import { BodyText } from '../../components/BodyText';

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
          <BodyText style={styles.title}>{name}</BodyText>
          {subtitle && (
            <BodyText color="secondary" style={styles.link}>
              {subtitle}
            </BodyText>
          )}
        </View>
        {isMe && <BodyText style={styles.subtitle}>me</BodyText>}
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
