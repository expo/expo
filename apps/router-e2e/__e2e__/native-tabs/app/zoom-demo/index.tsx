import FontAwesomeIcons from '@expo/vector-icons/FontAwesome5';
import { Link } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable, Platform, ColorValue, DynamicColorIOS } from 'react-native';

export default function ZoomDemoIndex() {
  const [isPlaying, setIsPlaying] = useState(false);
  const textColor = Platform.select<ColorValue>({
    ios: DynamicColorIOS({ light: 'black', dark: 'white' }),
    default: 'black',
  });

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150, paddingHorizontal: 20 }}>
      <Link href="/zoom-demo/player" asChild>
        <Link.Trigger>
          <Link.AppleZoom>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                gap: 12,
                backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.9)' : '#fff',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: 'blue',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <FontAwesomeIcons name="music" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>
                  Zoom Demo Song
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>Tap to test dismiss zone</Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}>
                <FontAwesomeIcons name={isPlaying ? 'pause' : 'play'} size={20} color={textColor} />
              </Pressable>
            </Pressable>
          </Link.AppleZoom>
        </Link.Trigger>
      </Link>
    </View>
  );
}
