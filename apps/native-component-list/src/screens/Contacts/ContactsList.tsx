import * as Contacts from 'expo-contacts';
import * as React from 'react';
import { FlatList, FlatListProps, ListRenderItem, StyleProp, ViewStyle } from 'react-native';

import ContactsListItem from './ContactsListItem';

type Props = {
  onPressItem: (id: string) => void;
  style?: StyleProp<ViewStyle>;
  data: Contacts.ExistingContact[];
} & Pick<
  FlatListProps<Contacts.ExistingContact>,
  Exclude<keyof FlatListProps<Contacts.ExistingContact>, 'renderItem' | 'keyExtractor' | 'data'>
>;

export default function ContactsList({ data, style, onPressItem, ...props }: Props) {
  const renderItem: ListRenderItem<Contacts.ExistingContact> = React.useCallback(
    ({ item }) => (
      <ContactsListItem
        key={item.id}
        contactId={item.id!}
        {...item}
        onPress={(id: string) => onPressItem?.(id)}
      />
    ),
    [onPressItem]
  );

  return (
    <FlatList<Contacts.ExistingContact>
      {...props}
      style={[{ flex: 1 }, style]}
      keyExtractor={(item) => item.id!}
      data={data}
      renderItem={renderItem}
    />
  );
}
