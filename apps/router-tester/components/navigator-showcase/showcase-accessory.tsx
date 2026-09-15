import { NativeTabs } from 'expo-router/native-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ShowcaseAccessory({
  isPlaying,
  setIsPlaying,
}: {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
}) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return (
    <View style={styles.container}>
      <View style={styles.artwork}>
        <Text style={styles.note}>♪</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          Midnight Drive
        </Text>
        {placement === 'regular' && <Text style={styles.artist}>Neon Coast</Text>}
      </View>
      <Pressable
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        onPress={() => setIsPlaying(!isPlaying)}>
        <Text style={styles.control}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
      </Pressable>
      {placement === 'regular' && <Text style={styles.control}>▶|</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  artwork: {
    height: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
  },
  note: { color: 'white', fontSize: 20 },
  copy: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  artist: { fontSize: 12, color: '#777' },
  control: { fontSize: 18, fontWeight: '700', paddingHorizontal: 6 },
});
