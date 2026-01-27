import { Color, Link, Stack } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Alert } from 'react-native';

export default function ScreenBottom() {
  const [showToolbar, setShowToolbar] = useState(true);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Another Bottom Screen</Text>
        <Text style={styles.subtitle}>Same placement as index - different items</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toolbar Control</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Toolbar</Text>
            <Switch
              testID="toggle-toolbar-bottom"
              value={showToolbar}
              onValueChange={setShowToolbar}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigate Further</Text>

          <Link href="/toolbar-placement/screen-left" asChild>
            <Pressable testID="nav-to-left-from-bottom" style={styles.navButton}>
              <Text style={styles.navButtonText}>Go to Left Placement</Text>
            </Pressable>
          </Link>

          <Link href="/toolbar-placement/screen-right" asChild>
            <Pressable testID="nav-to-right-from-bottom" style={styles.navButton}>
              <Text style={styles.navButtonText}>Go to Right Placement</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Behavior</Text>
          <Text style={styles.instruction}>
            - Bottom toolbar should show different items than index
          </Text>
          <Text style={styles.instruction}>
            - Going back to index should show index's toolbar items
          </Text>
          <Text style={styles.instruction}>
            - Each screen maintains its own toolbar state
          </Text>
        </View>
      </ScrollView>

      {showToolbar && (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Button
            icon="star"
            tintColor={Color.ios.systemYellow}
            onPress={() => Alert.alert('Star', 'Star button pressed')}
          />
          <Stack.Toolbar.Button
            icon="heart"
            tintColor={Color.ios.systemRed}
            onPress={() => Alert.alert('Heart', 'Heart button pressed')}
          />
          <Stack.Toolbar.Button
            icon="bookmark"
            tintColor={Color.ios.systemPurple}
            onPress={() => Alert.alert('Bookmark', 'Bookmark button pressed')}
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
