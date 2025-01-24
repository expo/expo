import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { Button, StyleSheet, ScrollView, Text, View } from 'react-native';

export default function App() {
  const updatesInfo = {
    createdAt: Updates.createdAt,
    updateId: Updates.updateId,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    manifest: Updates.manifest,
  };
  const overrideUrl =
    process.env.EXPO_OS === 'android'
      ? 'https://u.expo.dev/5199d29a-6709-4da7-94f2-b74fde960203/group/50d4eb0e-21d6-4569-846a-62ea7e2f2dce'
      : 'https://u.expo.dev/740ac14e-8607-4002-88e7-226781d2f2c2/group/50d4eb0e-21d6-4569-846a-62ea7e2f2dce';

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text>{JSON.stringify(updatesInfo, null, 2)}</Text>
        <Button
          title="Set update overrides"
          onPress={() => {
            Updates.setUpdatesURLAndRequestHeadersOverride({
              updateUrl: overrideUrl,
              requestHeaders: {
                'expo-channel-name': 'preview',
              },
            });
          }}
        />
        {/* <Button
          title="Reset update overrides"
          onPress={() => {
            Updates.setUpdatesURLAndRequestHeadersOverride(null);
          }}
        /> */}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 64,
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
