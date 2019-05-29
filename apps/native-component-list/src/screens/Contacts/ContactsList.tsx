import React from 'react';
import { FlatList, StyleProp, ViewStyle, ListRenderItem, FlatListProps } from 'react-native';
import * as Contacts from 'expo-contacts';

import ContactsListItem from './ContactsListItem';

export default class ContactsList extends React.Component<
  {
    onPressItem: (id: string) => void;
    style?: StyleProp<ViewStyle>;
    data: Contacts.Contact[];
  } & Pick<
    FlatListProps<Contacts.Contact>,
    Exclude<keyof FlatListProps<Contacts.Contact>, 'renderItem' | 'keyExtractor' | 'data'>
  >
> {
  onPressItem = (id: string) => {
    this.props.onPressItem && this.props.onPressItem(id);
  }

  renderItem: ListRenderItem<Contacts.Contact> = ({ item }) => (
    <ContactsListItem key={item.id} contactId={item.id} {...item} onPress={this.onPressItem} />
  )

  render() {
    const { data, style, ...props } = this.props;
    return (
      <FlatList<Contacts.Contact>
        {...props}
        style={[{ flex: 1 }, style]}
        keyExtractor={item => item.id}
        data={data}
        renderItem={this.renderItem}
      />
    );
  }
}
