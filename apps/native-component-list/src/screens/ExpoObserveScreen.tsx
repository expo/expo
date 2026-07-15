import { useTheme } from 'ThemeProvider';
import * as Linking from 'expo-linking';
import { useObserve } from 'expo-observe';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExpoObserveScreen() {
  const { theme } = useTheme();
  const { markInteractive } = useObserve();
  const router = useRouter();

  useEffect(() => {
    markInteractive();
  }, [markInteractive]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <TouchableOpacity
        onPress={() =>
          Linking.openURL(
            Linking.createURL('apis/expo-observe/filtered/42/acct-123?firstName=Ada&tab=posts')
          )
        }>
        <Text style={[styles.button, { color: theme.text.link }]}>Open filtered params</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/apis/expo-observe/filtered/7/acct-99?p1=p1&p2=p2')}>
        <Text style={[styles.button, { color: theme.text.link }]}>Navigate with params</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  button: {
    fontSize: 18,
    fontWeight: '600',
  },
});
