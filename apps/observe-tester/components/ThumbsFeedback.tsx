import { Observe } from 'expo-observe';
import { Button, View } from 'react-native';

export function ThumbsFeedback() {
  function send(rating: number) {
    Observe.reportFeedback({ id: 'article-helpful', rating, scale: { min: 0, max: 1 } });
  }

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Button title="Thumbs down" onPress={() => send(0)} />
      <Button title="Thumbs up" onPress={() => send(1)} />
    </View>
  );
}
