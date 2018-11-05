import React from 'react';
import { SectionList, Text } from 'react-native';

import ContactDetailListItem from './ContactDetailListItem';
import Colors from '../../constants/Colors';

export default class ContactDetailList extends React.Component {
  renderItem = ({ item = {} }) => (
    <ContactDetailListItem key={item.id} contactId={item.id} {...item} />
  );

  render() {
    const { data, style, ...props } = this.props;
    return (
      <SectionList
        {...props}
        renderSectionHeader={({ section: { title } }) => (
          <Text
            style={{
              fontWeight: 'bold',
              paddingVertical: 4,
              paddingHorizontal: 16,
              backgroundColor: Colors.greyBackground,
              color: Colors.tintColor,
            }}>
            {title}
          </Text>
        )}
        style={[{ flex: 1 }, style]}
        keyExtractor={item => item.id}
        sections={data}
        renderItem={this.renderItem}
      />
    );
  }
}
