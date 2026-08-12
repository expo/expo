import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { listNotesAsync, type Note } from './src/notes';
import { loadSettingsAsync, type Settings } from './src/settings';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    listNotesAsync().then(setNotes);
    loadSettingsAsync().then(setSettings);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: settings?.fontSize ?? 16 }}>Notes</Text>
      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}
