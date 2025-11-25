import FontAwesomeIcons from '@expo/vector-icons/FontAwesome5';
import { ColorValue, DynamicColorIOS, Platform, Pressable, Text, View } from 'react-native';

export function MiniPlayer() {
  const textColor = Platform.select<ColorValue>({
    ios: DynamicColorIOS({ light: 'black', dark: 'white' }),
    default: 'white',
  });
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          // width,
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
          gap: 8,
        }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
          <View
            style={{
              backgroundColor: 'blue',
              height: '100%',
              aspectRatio: 1,
              borderRadius: 8,
            }}
          />
          <View>
            <Text
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: textColor,
              }}>
              Bad Habits
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: textColor,
              }}>
              Ed Sheeran
            </Text>
          </View>
        </View>
        <Pressable onPress={() => console.log('play pressed')}>
          <FontAwesomeIcons name="play" size={18} color={textColor} />
        </Pressable>
        <Pressable onPress={() => console.log('forward pressed')}>
          <FontAwesomeIcons name="forward" size={24} color={textColor} />
        </Pressable>
      </View>
    </View>
  );
}
