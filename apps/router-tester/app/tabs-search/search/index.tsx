import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

export default function Search() {
  const [query, setQuery] = useState('');
  return (
    <>
      <Stack.Title>Search</Stack.Title>
      <Stack.SearchBar
        placement="automatic"
        placeholder="Search"
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
      />
      <ScrollView
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 16 }}
        contentInsetAdjustmentBehavior="automatic">
        <Text>Query: {query}</Text>
      </ScrollView>
    </>
  );
}
