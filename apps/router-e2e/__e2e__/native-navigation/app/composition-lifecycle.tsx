import { Stack } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';

export default function CompositionLifecycleScreen() {
  // Title
  const [showTitle, setShowTitle] = useState(false);
  const [titleText, setTitleText] = useState('Custom Title');

  // BackButton
  const [showBackButton, setShowBackButton] = useState(false);
  const [backButtonLabel, setBackButtonLabel] = useState('Back');

  // Header
  const [showHeader, setShowHeader] = useState(false);
  const [headerBlur, setHeaderBlur] = useState(false);
  const [headerBgColor, setHeaderBgColor] = useState<string | undefined>(undefined);

  // Left Toolbar
  const [showLeftToolbar, setShowLeftToolbar] = useState(false);

  // Right Toolbar
  const [showRightToolbar, setShowRightToolbar] = useState(false);

  // SearchBar
  const [showSearchBar, setShowSearchBar] = useState(false);

  return (
    <>
      <Stack.Screen>
        {showTitle && <Stack.Screen.Title>{titleText}</Stack.Screen.Title>}

        {showBackButton && <Stack.Screen.BackButton>{backButtonLabel}</Stack.Screen.BackButton>}

        {showHeader && (
          <Stack.Header
            blurEffect={headerBlur ? 'systemMaterial' : undefined}
            style={{ backgroundColor: headerBgColor }}
          />
        )}

        {showLeftToolbar && (
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
              icon="star"
              onPress={() => Alert.alert('Left Toolbar', 'Star pressed')}
            />
          </Stack.Toolbar>
        )}

        {showRightToolbar && (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon="heart"
              onPress={() => Alert.alert('Right Toolbar', 'Heart pressed')}
            />
          </Stack.Toolbar>
        )}
      </Stack.Screen>

      {showSearchBar && (
        <Stack.SearchBar placeholder="Search..." onChangeText={() => {}} />
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Composition Lifecycle</Text>
        <Text style={styles.subtitle}>
          Tests mount/unmount of each composition component via conditional rendering.
        </Text>

        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Title</Text>
            <Switch testID="toggle-title" value={showTitle} onValueChange={setShowTitle} />
          </View>
          {showTitle && (
            <View style={styles.inputRow}>
              <Text style={styles.label}>Title Text</Text>
              <TextInput
                testID="input-title-text"
                style={styles.textInput}
                value={titleText}
                onChangeText={setTitleText}
              />
            </View>
          )}
        </View>

        {/* BackButton Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Back Button</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show BackButton</Text>
            <Switch
              testID="toggle-back-button"
              value={showBackButton}
              onValueChange={setShowBackButton}
            />
          </View>
          {showBackButton && (
            <View style={styles.inputRow}>
              <Text style={styles.label}>Label</Text>
              <TextInput
                testID="input-back-button-label"
                style={styles.textInput}
                value={backButtonLabel}
                onChangeText={setBackButtonLabel}
              />
            </View>
          )}
        </View>

        {/* Header Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Header</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Header</Text>
            <Switch testID="toggle-header" value={showHeader} onValueChange={setShowHeader} />
          </View>
          {showHeader && (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Blur Effect</Text>
                <Switch
                  testID="toggle-header-blur"
                  value={headerBlur}
                  onValueChange={setHeaderBlur}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Background Color</Text>
                <View style={styles.colorButtonsRow}>
                  <Pressable
                    testID="header-color-none"
                    style={[styles.colorButton, { backgroundColor: '#fff', borderWidth: 1 }]}
                    onPress={() => setHeaderBgColor(undefined)}
                  />
                  <Pressable
                    testID="header-color-blue"
                    style={[styles.colorButton, { backgroundColor: '#007AFF' }]}
                    onPress={() => setHeaderBgColor('#007AFF')}
                  />
                  <Pressable
                    testID="header-color-red"
                    style={[styles.colorButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => setHeaderBgColor('#FF3B30')}
                  />
                  <Pressable
                    testID="header-color-green"
                    style={[styles.colorButton, { backgroundColor: '#34C759' }]}
                    onPress={() => setHeaderBgColor('#34C759')}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Left Toolbar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Left Toolbar</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Left Toolbar</Text>
            <Switch
              testID="toggle-left-toolbar"
              value={showLeftToolbar}
              onValueChange={setShowLeftToolbar}
            />
          </View>
        </View>

        {/* Right Toolbar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Right Toolbar</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Right Toolbar</Text>
            <Switch
              testID="toggle-right-toolbar"
              value={showRightToolbar}
              onValueChange={setShowRightToolbar}
            />
          </View>
        </View>

        {/* SearchBar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SearchBar</Text>
          <Text style={styles.note}>
            Note: SearchBar uses navigation.setOptions, not composition registry.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Show SearchBar</Text>
            <Switch
              testID="toggle-search-bar"
              value={showSearchBar}
              onValueChange={setShowSearchBar}
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instruction}>
            1. Toggle each component on/off to test mount/unmount lifecycle
          </Text>
          <Text style={styles.instruction}>
            2. While mounted, change props (title text, back button label, bg color) to test dynamic
            updates
          </Text>
          <Text style={styles.instruction}>
            3. Unmount all components and verify header reverts to defaults
          </Text>
          <Text style={styles.instruction}>
            4. Components use conditional rendering (not hidden prop) to fully mount/unmount
          </Text>
        </View>
      </ScrollView>
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
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    width: 160,
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    marginVertical: 4,
    color: '#666',
  },
  colorButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: '#ccc',
  },
});
