import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import {
  SectionList,
  SectionListProps,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Colors from '../../constants/Colors';

export interface DetailListItem {
  label: string;
  value: string;
  id: string;
  onPress?: () => void;
}

function ContactDetailListItem({ label, value, onPress }: DetailListItem) {
  return (
    <TouchableHighlight
      underlayColor={Colors.listItemTouchableHighlight}
      disabled={!onPress}
      onPress={onPress}>
      <View style={styles.container}>
        <View style={{ maxWidth: '80%' }}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.link}>{value}</Text>
        </View>
        {onPress && <Ionicons size={24} color={Colors.tabIconDefault} name="arrow-forward" />}
      </View>
    </TouchableHighlight>
  );
}

export default function ContactDetailList(props: SectionListProps<DetailListItem>) {
  return (
    <SectionList
      {...props}
      renderSectionHeader={({ section: { title } }) => <Text style={styles.header}>{title}</Text>}
      style={styles.list}
      keyExtractor={(item) => item.id}
      sections={props.sections}
      renderItem={({ item }) => <ContactDetailListItem {...item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: {
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: Colors.greyBackground,
    color: Colors.tintColor,
  },
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
