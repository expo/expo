import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { listNotesAsync, type Note } from './src/db';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      // The list refreshes on an interval, so queries run while imports happen.
      listNotesAsync().then(setNotes);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Notes ({notes.length})</Text>
      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}
