import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { listNotesAsync, type Note } from './src/notes';
import { listTagsAsync, type Tag } from './src/tags';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    listNotesAsync().then(setNotes);
    listTagsAsync().then(setTags);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Notes ({tags.length} tags)</Text>
      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}
