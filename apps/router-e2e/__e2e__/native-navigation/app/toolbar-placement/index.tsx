import { Color, Link, Stack } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Alert } from 'react-native';

export default function ToolbarPlacementIndex() {
  const [showToolbar, setShowToolbar] = useState(true);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Placement Stack - Index</Text>
        <Text style={styles.subtitle}>Bottom Toolbar (default)</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toolbar Control</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Toolbar</Text>
            <Switch
              testID="toggle-toolbar-index"
              value={showToolbar}
              onValueChange={setShowToolbar}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigate to Different Placements</Text>

          <Link href="/toolbar-placement/screen-left" asChild>
            <Pressable testID="nav-to-left" style={styles.navButton}>
              <Text style={styles.navButtonText}>Left Placement Screen</Text>
            </Pressable>
          </Link>

          <Link href="/toolbar-placement/screen-right" asChild>
            <Pressable testID="nav-to-right" style={styles.navButton}>
              <Text style={styles.navButtonText}>Right Placement Screen</Text>
            </Pressable>
          </Link>

          <Link href="/toolbar-placement/screen-bottom" asChild>
            <Pressable testID="nav-to-bottom" style={styles.navButton}>
              <Text style={styles.navButtonText}>Another Bottom Placement Screen</Text>
            </Pressable>
          </Link>

          <Link href="/toolbar-placement/screen-multi" asChild>
            <Pressable testID="nav-to-multi" style={styles.navButton}>
              <Text style={styles.navButtonText}>Multiple Toolbars Screen</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Cases</Text>
          <Text style={styles.instruction}>
            1. Toggle toolbar visibility and verify it unmounts/mounts correctly
          </Text>
          <Text style={styles.instruction}>
            2. Navigate to screens with different placements
          </Text>
          <Text style={styles.instruction}>
            3. Go back and verify toolbars clean up properly
          </Text>
          <Text style={styles.instruction}>
            4. Check that header items don't persist after navigating back
          </Text>
        </View>
      </ScrollView>

      {showToolbar && (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Button
            icon="house"
            tintColor={Color.ios.systemBlue}
            onPress={() => Alert.alert('Home', 'Home button pressed')}
          />
          <Stack.Toolbar.Button
            icon="gear"
            tintColor={Color.ios.systemGray}
            onPress={() => Alert.alert('Settings', 'Settings button pressed')}
          />
          <Stack.Toolbar.Spacer />
        </Stack.Toolbar>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
  },
  navButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgb(11, 103, 175)',
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 14,
    marginVertical: 4,
    color: '#666',
  },
});
