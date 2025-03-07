import { Text, View } from 'react-native';

// import 'foobar';

export default function App() {
  return (
    <View style={{ flex: 1, padding: 48 }}>
      <Text
        style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
        onPress={() => {
          // @ts-expect-error
          undefined();
        }}>
        Runtime error: undefined is not a function
      </Text>
    </View>
  );
}
