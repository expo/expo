import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';

// The embedded app config is what this fixture exists to verify: under SwiftPM
// nothing writes `EXConstants.bundle/app.config` unless the autolinking plugin
// contributes a build-time script phase, and `expoConfig` is null without it.
export default function App() {
  const config = Constants.expoConfig;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{config?.name ?? 'minimal-swiftpm'}</Text>
      <Text style={config ? styles.ok : styles.missing}>
        {config
          ? `Embedded app config found — Expo SDK ${config.sdkVersion}`
          : 'Embedded app config MISSING'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { fontSize: 20, fontWeight: '600' },
  ok: { fontSize: 15, color: '#137333', textAlign: 'center' },
  missing: { fontSize: 15, color: '#c5221f', fontWeight: '600', textAlign: 'center' },
});
