import { Pressable, Text, View } from 'react-native';

export function MutateButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable style={{ display: 'contents' }} onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            {
              padding: 8,
              flex: 1,
              borderRadius: 24,
              borderCurve: 'continuous',
              borderWidth: 0.5,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: '#ccc',
            },
            pressed && { backgroundColor: '#eee' },
          ]}>
          <Text style={{ fontWeight: '600' }}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}
