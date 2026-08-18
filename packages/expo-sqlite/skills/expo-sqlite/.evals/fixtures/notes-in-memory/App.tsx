import { useState } from 'react';
import { Button, FlatList, Text, TextInput, View } from 'react-native';

interface Note {
  id: number;
  text: string;
}

// Notes live in component state only: they are gone after an app restart.
export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');

  const addNote = () => {
    if (!draft.trim()) {
      return;
    }
    setNotes((current) => [...current, { id: Date.now(), text: draft.trim() }]);
    setDraft('');
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Notes</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Write a note"
        style={{ borderWidth: 1, padding: 8 }}
      />
      <Button title="Add" onPress={addNote} />
      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}
