import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'ThemeProvider';
import AppMetrics, { type MainSession, type Metric } from 'expo-app-metrics';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AppMetricsScreen() {
  const { theme } = useTheme();
  const [session, setSession] = React.useState<MainSession | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      AppMetrics.getMainSession().then((s) => {
        if (!cancelled) setSession(s);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      setSession(await AppMetrics.getMainSession());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const navMetrics: Metric[] = (session?.metrics ?? []).filter((m) => m.category === 'navigation');

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={[styles.header, { color: theme.text.default }]}>Navigation metrics</Text>
      {navMetrics.length === 0 ? (
        <Text style={{ color: theme.text.secondary }}>
          No navigation metrics yet. Navigate around the app, then pull to refresh.
        </Text>
      ) : (
        navMetrics.map((m, i) => (
          <View key={`${m.timestamp}-${i}`} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={[styles.name, { color: theme.text.default }]}>
                expo.navigation.{m.name}
              </Text>
              <Text style={[styles.value, { color: theme.text.default }]}>
                {m.value.toFixed(3)}s
              </Text>
            </View>
            {m.routeName ? (
              <Text style={{ color: theme.text.secondary }}>Route: {m.routeName}</Text>
            ) : null}
            {m.params ? (
              <Text style={{ color: theme.text.secondary }}>
                Params: {JSON.stringify(m.params)}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

AppMetricsScreen.navigationOptions = { title: 'App Metrics' };

const styles = StyleSheet.create({
  content: { padding: 12, gap: 8 },
  header: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  row: {
    paddingVertical: 8,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontFamily: 'Courier', fontSize: 14 },
  value: { fontFamily: 'Courier', fontSize: 14 },
});
