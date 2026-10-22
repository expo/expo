import { Image } from 'expo-image';
import { Color } from 'expo-router';
import { ScrollView, View, Text, useColorScheme, useWindowDimensions } from 'react-native';

import { STATIONS } from '../../../components/music-demo/music';

export default function RadioScreen() {
  const isDark = useColorScheme() === 'dark';
  const { width } = useWindowDimensions();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {/* Featured Station */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View
          style={{
            width: width - 32,
            height: 200,
            borderRadius: 14,
            borderCurve: 'continuous',
            overflow: 'hidden',
            backgroundColor: STATIONS[0].color,
            justifyContent: 'flex-end',
            padding: 20,
          }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
            Live Now
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 28,
              fontWeight: '700',
              marginTop: 4,
            }}>
            {STATIONS[0].name}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 15,
              marginTop: 4,
            }}>
            {STATIONS[0].description}
          </Text>
        </View>
      </View>

      {/* Stations */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: isDark ? '#fff' : '#000',
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: 8,
        }}>
        Stations
      </Text>
      <View style={{ paddingHorizontal: 16, gap: 1, paddingBottom: 120 }}>
        {STATIONS.map((station) => (
          <View
            key={station.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 10,
              borderBottomWidth: station.id !== STATIONS[STATIONS.length - 1].id ? 0.5 : 0,
              borderBottomColor: Color.ios.separator,
            }}>
            <Image
              source={{ uri: station.artwork }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: station.color,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#fff' : '#000',
                }}>
                {station.name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: Color.ios.secondaryLabel,
                  marginTop: 2,
                }}>
                {station.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
