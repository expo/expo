import * as Contacts from 'expo-contacts';
import * as React from 'react';
import { FlatList, FlatListProps, ListRenderItem, StyleProp, ViewStyle } from 'react-native';

import ContactsListItem from './ContactsListItem';

type Props = {
  onPressItem: (id: string) => void;
  style?: StyleProp<ViewStyle>;
  data: Contacts.Contact[];
} & Pick<
  FlatListProps<Contacts.Contact>,
  Exclude<keyof FlatListProps<Contacts.Contact>, 'renderItem' | 'keyExtractor' | 'data'>
>;

export default function ContactsList({ data, style, onPressItem, ...props }: Props) {
  const renderItem: ListRenderItem<Contacts.Contact> = React.useCallback(
    ({ item }) => (
      <ContactsListItem
        key={item.id}
        contactId={item.id!}
        phoneNumber={item.phoneNumbers?.[0].number}
        {...item}
        onPress={(id: string) => onPressItem?.(id)}
      />
    ),
    [onPressItem]
  );

  return (
    <FlatList<Contacts.Contact>
      {...props}
      style={[{ flex: 1 }, style]}
      keyExtractor={(item) => item.id!}
      data={data}
      renderItem={renderItem}
    />
  );
}
