import { Color, Stack } from 'expo-router';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert } from 'react-native';

export default function ScreenMulti() {
  const [showLeftToolbar, setShowLeftToolbar] = useState(true);
  const [showRightToolbar, setShowRightToolbar] = useState(true);
  const [showBottomToolbar, setShowBottomToolbar] = useState(true);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Multiple Toolbars Screen</Text>
        <Text style={styles.subtitle}>Left + Right + Bottom simultaneously</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Toolbar Controls</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Left Toolbar</Text>
            <Switch
              testID="toggle-toolbar-multi-left"
              value={showLeftToolbar}
              onValueChange={setShowLeftToolbar}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Right Toolbar</Text>
            <Switch
              testID="toggle-toolbar-multi-right"
              value={showRightToolbar}
              onValueChange={setShowRightToolbar}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Bottom Toolbar</Text>
            <Switch
              testID="toggle-toolbar-multi-bottom"
              value={showBottomToolbar}
              onValueChange={setShowBottomToolbar}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Behavior</Text>
          <Text style={styles.instruction}>
            - All three toolbars can be shown simultaneously
          </Text>
          <Text style={styles.instruction}>
            - Each can be toggled independently
          </Text>
          <Text style={styles.instruction}>
            - Unmounting one should not affect others
          </Text>
          <Text style={styles.instruction}>
            - Going back should clean up all toolbar items
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current State</Text>
          <Text style={styles.stateText}>Left: {showLeftToolbar ? 'Visible' : 'Hidden'}</Text>
          <Text style={styles.stateText}>Right: {showRightToolbar ? 'Visible' : 'Hidden'}</Text>
          <Text style={styles.stateText}>Bottom: {showBottomToolbar ? 'Visible' : 'Hidden'}</Text>
        </View>
      </ScrollView>

      {showLeftToolbar && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            icon="sidebar.left"
            tintColor={Color.ios.systemBlue}
            onPress={() => Alert.alert('Left', 'Left sidebar pressed')}
          />
        </Stack.Toolbar>
      )}

      {showRightToolbar && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="magnifyingglass"
            tintColor={Color.ios.systemBlue}
            onPress={() => Alert.alert('Search', 'Search pressed')}
          />
          <Stack.Toolbar.Button
            icon="ellipsis.circle"
            tintColor={Color.ios.systemGray}
            onPress={() => Alert.alert('More', 'More pressed')}
          />
        </Stack.Toolbar>
      )}

      {showBottomToolbar && (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Button
            icon="square.and.arrow.up"
            tintColor={Color.ios.systemBlue}
            onPress={() => Alert.alert('Share', 'Share pressed')}
          />
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Button
            icon="trash"
            tintColor={Color.ios.systemRed}
            onPress={() => Alert.alert('Delete', 'Delete pressed')}
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
  stateText: {
    fontSize: 14,
    marginVertical: 4,
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    marginVertical: 4,
    color: '#666',
  },
});
