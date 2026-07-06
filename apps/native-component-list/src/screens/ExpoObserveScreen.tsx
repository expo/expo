import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'ThemeProvider';
import * as Linking from 'expo-linking';
import { useObserve } from 'expo-observe';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Stack = createNativeStackNavigator();

type FilteredParamsRoute = {
  params?: {
    userId?: string;
    accountId?: string;
    firstName?: string;
    tab?: string;
  };
};

function IndexScreen() {
  const { theme } = useTheme();
  const { markInteractive } = useObserve();

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
    </View>
  );
}

function FilteredParamsScreen({ route }: { route: FilteredParamsRoute }) {
  const { userId, accountId, firstName, tab } = route.params ?? {};
  const { theme } = useTheme();
  const { markInteractive } = useObserve();

  useEffect(() => {
    markInteractive();
  }, [markInteractive]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <Text style={[styles.label, { color: theme.text.secondary }]}>Route params</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>userId: {userId}</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>accountId: {accountId}</Text>
      <Text style={[styles.label, { color: theme.text.secondary }]}>Query params</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>firstName: {firstName}</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>tab: {tab}</Text>
    </View>
  );
}

export default function ExpoObserveScreen() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.default },
        headerTintColor: theme.icon.info,
        headerTitleStyle: { color: theme.text.default },
      }}>
      <Stack.Screen name="index" component={IndexScreen} options={{ title: 'Expo Observe' }} />
      <Stack.Screen
        name="filteredParams"
        component={FilteredParamsScreen}
        options={{ title: 'Filtered Params' }}
      />
    </Stack.Navigator>
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
  label: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
});
