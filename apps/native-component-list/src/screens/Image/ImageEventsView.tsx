import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, FlatList } from 'react-native';

import { Colors } from '../../constants';

type PropsType = {
  events: string[];
  onClear: () => any;
};

export default class ImageEventsView extends React.Component<PropsType> {
  renderItem = ({ item }: any) => {
    return (
      <View style={styles.eventContainer}>
        <Text style={styles.eventText}>{item}</Text>
      </View>
    );
  };

  keyExtractor = (item: any, index: number) => {
    return index + '';
  };

  render() {
    const { events, onClear } = this.props;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Events</Text>
          <TouchableOpacity activeOpacity={0.5} onPress={onClear}>
            <MaterialIcons name="clear" size={25} />
          </TouchableOpacity>
        </View>
        <FlatList
          style={styles.content}
          data={events}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  content: {
    backgroundColor: 'white',
    flex: 1,
    paddingTop: 10,
  },
  eventContainer: {
    paddingHorizontal: 10,
    flexDirection: 'row',
  },
  eventText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.secondaryText,
  },
});
