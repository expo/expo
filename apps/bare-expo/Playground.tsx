import { useTheme } from 'ThemeProvider';
import { TabBackground } from 'native-component-list/src/components/TabBackground';
import TabIcon from 'native-component-list/src/components/TabIcon';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Empty scratch screen for isolating reproductions. Replace the contents with your repro code
// and open it from the Playground tab. Revert your changes before committing unrelated work.
export default function Playground() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background.default }]}>
      <TabIcon name="flask-outline" size={48} />
      <Text style={[styles.title, { color: theme.text.default }]}>Playground</Text>
      <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
        Replace the contents of apps/bare-expo/Playground.tsx with your repro code.
      </Text>
    </View>
  );
}

Playground.navigationOptions = {
  title: 'Playground',
  tabBarLabel: 'Playground',
  tabBarIcon: ({ focused }: { focused: boolean }) => {
    return <TabIcon name="flask-outline" focused={focused} />;
  },
  tabBarBackground: () => <TabBackground />,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
