import { ContactsAccessButton } from 'expo-contacts';
import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';

export default function ContactsAccessButtonScreen() {
  const [queryString, setQueryString] = React.useState('');
  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.input}
        defaultValue={queryString}
        onChangeText={setQueryString}
        placeholder="Query string"
      />
      <ContactsAccessButton queryString={queryString} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
});
