import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { searchNotesAsync, type Note } from './src/db';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);

  const search = async (text: string) => {
    setQuery(text);
    setResults(text ? await searchNotesAsync(text) : []);
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Search notes</Text>
      <TextInput
        value={query}
        onChangeText={search}
        placeholder="Search"
        style={{ borderWidth: 1, padding: 8 }}
      />
      <FlatList
        data={results}
        keyExtractor={(note) => String(note.id)}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}
