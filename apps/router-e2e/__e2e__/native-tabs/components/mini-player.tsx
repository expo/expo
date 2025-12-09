import FontAwesomeIcons from '@expo/vector-icons/FontAwesome5';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Image, ColorValue, DynamicColorIOS, Platform, Pressable, Text, View } from 'react-native';
import { ShimmerText } from './shimmer';
import { Color } from 'expo-router';

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
          gap: 12,
        }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
          <Image
            source={require('../../../assets/echo.png')}
            style={{
              width: 30,
              // backgroundColor: 'blue',
              height: '100%',
              aspectRatio: 1,
              borderRadius: 8,
            }}
          />
          <View style={{ gap: 2 }}>
            <ShimmerText
              style={{
                fontSize: 14,
                color: textColor,
                width: placement === 'regular' ? 300 : 175,
              }}
              ellipsizeMode="clip"
              lineBreakMode="middle"
              numberOfLines={1}
              highlightColor="#9DA3AE"
              speed={0.7}>
              {placement === 'regular'
                ? 'Designing Liquid Glass accessory...'
                : 'Designing accessory...'}
            </ShimmerText>
            <Text
              style={{
                fontSize: 10,
                color: Color.ios.secondaryLabel,
              }}>
              Claude Opus 4.5
            </Text>
          </View>
        </View>
        <Pressable onPress={() => setIsPlaying(!isPlaying)}>
          <Ionicons name={'stop'} size={18} color={Color.ios.label} />
        </Pressable>
        {placement === 'regular' && (
          <Pressable onPress={() => console.log('forward pressed')}>
            <Ionicons name="ellipsis-horizontal" size={20} color={textColor} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
import Ionicons from '@expo/vector-icons/Ionicons';
