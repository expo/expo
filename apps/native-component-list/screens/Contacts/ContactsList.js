import React from 'react';
import { FlatList } from 'react-native';

import ContactsListItem from './ContactsListItem';

export default class ContactsList extends React.Component {
  onPressItem = id => {
    this.props.onPressItem && this.props.onPressItem(id);
  };

  renderItem = ({ item = {} }) => (
    <ContactsListItem key={item.id} contactId={item.id} {...item} onPress={this.onPressItem} />
  );

  render() {
    const { data, style, ...props } = this.props;
    return (
      <FlatList
        {...props}
        style={[{ flex: 1 }, style]}
        keyExtractor={item => item.id}
        data={data}
        renderItem={this.renderItem}
      />
    );
  }
}
