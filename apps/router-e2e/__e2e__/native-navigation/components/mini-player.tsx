import FontAwesomeIcons from '@expo/vector-icons/FontAwesome5';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { ColorValue, DynamicColorIOS, Platform, Pressable, Text, View } from 'react-native';

interface MiniPlayerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export function MiniPlayer({ isPlaying, setIsPlaying }: MiniPlayerProps) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
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
        <Pressable
          testID={isPlaying ? 'pause-button' : 'play-button'}
          onPress={() => setIsPlaying(!isPlaying)}>
          <FontAwesomeIcons name={isPlaying ? 'pause' : 'play'} size={18} color={textColor} />
        </Pressable>
        {placement === 'regular' && (
          <Pressable testID="forward-button" onPress={() => console.log('forward pressed')}>
            <FontAwesomeIcons name="forward" size={24} color={textColor} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
