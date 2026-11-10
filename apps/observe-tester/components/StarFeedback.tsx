import { Observe } from 'expo-observe';
import { Pressable, Text, View } from 'react-native';

const STARS = [1, 2, 3, 4, 5];

export function StarFeedback() {
  function send(stars: number) {
    Observe.reportFeedback({ id: 'order-rating', rating: stars * 2 });
  }

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {STARS.map((stars) => (
        <Pressable key={stars} accessibilityLabel={`${stars} stars`} onPress={() => send(stars)}>
          <Text style={{ fontSize: 32 }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}
