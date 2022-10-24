import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ExampleListItemInterface {
  onExampleSelect: () => void;
  name: string;
}

export default function ExampleListItem({ onExampleSelect, name }: ExampleListItemInterface) {
  return (
    <TouchableOpacity onPress={onExampleSelect} style={styles.exampleListItem}>
      <Text style={styles.nameText}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exampleListItem: {
    flex: 1,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 30,
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    shadowColor: 'rgba(0,0,0,0.56)',
    backgroundColor: 'white',
  },
  nameText: {
    fontSize: 16,
  },
});
