import { Observe } from 'expo-observe';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const RATINGS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function FeedbackScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>();
  const [error, setError] = useState<string>();

  function send() {
    const text = message.trim();
    // `reportFeedback` drops a report without a message or a rating, so tell the user here.
    if (!text && rating === undefined) {
      setError('Add a message or a rating.');
      return;
    }
    Observe.reportFeedback({
      id: 'feedback-button',
      message: text || undefined,
      rating,
      attributes: { route: from ?? 'unknown' },
    });
    router.back();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}>
      <View style={styles.ratings}>
        {RATINGS.map((value) => (
          <Pressable
            key={value}
            onPress={() => {
              setRating(value);
              setError(undefined);
            }}
            style={[styles.rating, rating === value && styles.selected]}>
            <Text style={rating === value && styles.selectedText}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        multiline
        placeholder="Tell us what you think"
        value={message}
        onChangeText={(text) => {
          setMessage(text);
          setError(undefined);
        }}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Send" onPress={send} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  ratings: { flexDirection: 'row', gap: 4 },
  rating: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selected: { backgroundColor: '#000', borderColor: '#000' },
  selectedText: { color: '#fff' },
  input: {
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  error: { color: '#c00' },
});
