import { Image } from 'expo-image';
import { Color } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { SymbolView } from 'expo-symbols';
import { View, Text, useColorScheme } from 'react-native';

import { CURRENT_TRACK } from './music';

export default function MiniPlayer() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const fg = useColorScheme() === 'dark' ? '#fff' : '#000';

  if (placement === 'inline') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 8,
        }}>
        <Image
          source={{ uri: CURRENT_TRACK.artwork }}
          style={{ width: 32, height: 32, borderRadius: 6 }}
        />
        <Text style={{ color: fg, fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {CURRENT_TRACK.title}
        </Text>
        <SymbolView name="pause.fill" size={16} tintColor={fg} />
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}>
      <Image
        source={{ uri: CURRENT_TRACK.artwork }}
        style={{ aspectRatio: 1, height: '100%', borderRadius: 8 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: fg, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
          {CURRENT_TRACK.title}
        </Text>
        <Text style={{ color: Color.ios.secondaryLabel, fontSize: 13 }} numberOfLines={1}>
          {CURRENT_TRACK.artist}
        </Text>
      </View>
      <SymbolView name="pause.fill" size={22} tintColor={fg} />
      <SymbolView name="forward.fill" size={22} tintColor={fg} />
    </View>
  );
}
