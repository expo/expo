import { useImage } from 'expo-image';
import { Color, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';

import { searchIcon, closeIcon, micIcon, moreVertIcon, sendIcon, deleteIcon } from './icons';
import { ToggleRow } from '../components/ToggleRow';

export default function ToolbarScreen() {
  const params = useLocalSearchParams();
  // State for controlling toolbar items visibility
  const [showSearchBar, setShowSearchBar] = useState(!!params.searchBar);
  const [sharesBackgroundSearchBar, setSharesBackgroundSearchBar] = useState(true);
  const [hidesSharedBackgroundSearchBar, setHidesSharedBackgroundSearchBar] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(!!params.searchButton);
  const [sharesBackgroundSearchButton, setSharesBackgroundSearchButton] = useState(true);
  const [hidesSharedBackgroundSearchButton, setHidesSharedBackgroundSearchButton] = useState(false);
  const [showMicButton, setShowMicButton] = useState(!!params.micButton);
  const [showCustomView, setShowCustomView] = useState(false);
  const [showMenu, setShowMenu] = useState(!!params.menu);
  const [showXcassetButton, setShowXcassetButton] = useState(false);
  const [showXcassetMenu, setShowXcassetMenu] = useState(false);
  const [showFixedSpacer, setShowFixedSpacer] = useState(false);
  const [fixedSpacerShareBackground, setFixedSpacerShareBackground] = useState(false);
  const [fixedSpacerWidth, setFixedSpacerWidth] = useState(20);

  // State for search functionality
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // State for menu items
  const [emailsArchived, setEmailsArchived] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [favoriteColors, setFavoriteColors] = useState<('red' | 'blue' | 'green')[]>(['blue']);

  const handleSearch = () => {
    Alert.alert('Search', `Searching for: ${searchText || 'empty'}`);
  };

  const handleMic = () => {
    Alert.alert('Microphone', 'Voice input activated');
  };

  const handleClearSearch = () => {
    setSearchText('');
    searchInputRef.current?.clear();
    searchInputRef.current?.blur();
  };

  const handleArchiveToggle = () => {
    setEmailsArchived(!emailsArchived);
    Alert.alert('Archive', emailsArchived ? 'Unarchived emails' : 'Archived emails');
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleColorSelect = (color: 'red' | 'blue' | 'green') => {
    setFavoriteColors((prevColors) =>
      prevColors.includes(color) ? prevColors.filter((c) => c !== color) : [...prevColors, color]
    );
    Alert.alert('Color Selected', `You selected ${color}`);
  };

  const image = useImage('https://simpleicons.org/icons/expo.svg', {
    maxWidth: 24,
    maxHeight: 24,
    onError(error) {
      console.error(error);
    },
  });
  const image2 = useImage(require('../../../assets/sad-expo.svg'), {
    maxWidth: 24,
    maxHeight: 24,
    onError(error) {
      console.error(error);
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitle: false,
        }}
      />
      <Stack.SearchBar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Toolbar E2E Test Screen</Text>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="safari" />
        </Stack.Toolbar>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toolbar Items Visibility</Text>

          <ToggleRow
            label="Show Search Bar"
            testID="toggle-search-bar"
            value={showSearchBar}
            onValueChange={setShowSearchBar}
          />

          {showSearchBar && (
            <>
              <ToggleRow
                label="Search Bar Shares Background"
                testID="toggle-search-bar-share-background"
                value={sharesBackgroundSearchBar}
                onValueChange={setSharesBackgroundSearchBar}
              />

              <ToggleRow
                label="Search Bar Hides Shared Background"
                testID="toggle-search-bar-hide-shared-background"
                value={hidesSharedBackgroundSearchBar}
                onValueChange={setHidesSharedBackgroundSearchBar}
              />
            </>
          )}

          <ToggleRow
            label="Show Search Button"
            testID="toggle-search-button"
            value={showSearchButton}
            onValueChange={setShowSearchButton}
          />

          {showSearchButton && (
            <>
              <ToggleRow
                label="Search Shares Background"
                testID="toggle-search-button-share-background"
                value={sharesBackgroundSearchButton}
                onValueChange={setSharesBackgroundSearchButton}
              />

              <ToggleRow
                label="Search Hides Shared Background"
                testID="toggle-search-button-hide-shared-background"
                value={hidesSharedBackgroundSearchButton}
                onValueChange={setHidesSharedBackgroundSearchButton}
              />
            </>
          )}

          <ToggleRow
            label="Show Mic Button"
            testID="toggle-mic-button"
            value={showMicButton}
            onValueChange={setShowMicButton}
          />

          <ToggleRow
            label="Show Custom View"
            testID="toggle-custom-view"
            value={showCustomView}
            onValueChange={setShowCustomView}
          />

          <ToggleRow
            label="Show Menu"
            testID="toggle-menu"
            value={showMenu}
            onValueChange={setShowMenu}
          />

          <ToggleRow
            label="Show Xcasset Button"
            testID="toggle-xcasset-button"
            value={showXcassetButton}
            onValueChange={setShowXcassetButton}
          />

          <ToggleRow
            label="Show Xcasset Menu"
            testID="toggle-xcasset-menu"
            value={showXcassetMenu}
            onValueChange={setShowXcassetMenu}
          />

          <ToggleRow
            label="Show Fixed Spacer (20pt)"
            testID="toggle-fixed-spacer"
            value={showFixedSpacer}
            onValueChange={setShowFixedSpacer}
          />

          {showFixedSpacer && (
            <>
              <ToggleRow
                label="Fixed Spacer Shares Background"
                testID="toggle-fixed-spacer-share-background"
                value={fixedSpacerShareBackground}
                onValueChange={setFixedSpacerShareBackground}
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Fixed Spacer Width (pt)</Text>
                <TextInput
                  testID="input-fixed-spacer-width"
                  style={{ borderWidth: 1, borderColor: '#ccc', padding: 4, width: 60 }}
                  keyboardType="numeric"
                  value={fixedSpacerWidth.toString()}
                  onChangeText={(text) => {
                    const width = parseInt(text, 10);
                    if (!isNaN(width)) {
                      setFixedSpacerWidth(width);
                    }
                  }}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current State</Text>
          <Text style={styles.stateText}>Search Text: "{searchText}"</Text>
          <Text style={styles.stateText}>Search Focused: {isSearchFocused ? 'Yes' : 'No'}</Text>
          <Text style={styles.stateText}>Emails Archived: {emailsArchived ? 'Yes' : 'No'}</Text>
          <Text style={styles.stateText}>
            Notifications: {notificationsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.stateText}>Favorite Colors: {favoriteColors.join(', ')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instruction}>
            1. Toggle switches above to show/hide toolbar items
          </Text>
          <Text style={styles.instruction}>2. Tap search button to activate search input</Text>
          <Text style={styles.instruction}>3. Tap mic button to trigger voice input</Text>
          <Text style={styles.instruction}>4. Use menu to test nested actions</Text>
          <Text style={styles.instruction}>
            5. Observe menu items change based on state (e.g., Archive toggle)
          </Text>
        </View>
      </ScrollView>

      <Stack.Toolbar backgroundColor="red" tintColor="blue">
        {/* Flexible spacer at the start */}
        <Stack.Toolbar.Spacer />

        {/* Search bar */}
        <Stack.Toolbar.SearchBarSlot
          hidden={!showSearchBar}
          separateBackground={!sharesBackgroundSearchBar}
          hidesSharedBackground={hidesSharedBackgroundSearchBar}
        />

        {/* Search button */}
        <Stack.Toolbar.Button
          hidden={!showSearchButton}
          icon={process.env.EXPO_OS === 'ios' ? 'magnifyingglass' : searchIcon}
          tintColor={Platform.select({
            ios: Color.ios.systemBlue,
            android: Color.android.dynamic.onSurface,
          })}
          onPress={handleSearch}
          separateBackground={!sharesBackgroundSearchButton}
          hidesSharedBackground={hidesSharedBackgroundSearchButton}
        />

        <Stack.Toolbar.Button image={image} icon={closeIcon} />

        {/* Fixed width spacer */}
        <Stack.Toolbar.Spacer
          hidden={!showFixedSpacer}
          sharesBackground={fixedSpacerShareBackground}
          width={fixedSpacerWidth}
        />

        {/* Custom view with TextInput */}
        <Stack.Toolbar.View hidden={!showCustomView}>
          <TextInput
            ref={searchInputRef}
            testID="toolbar-search-input"
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search"
            placeholderTextColor={Color.ios.placeholderText}
            style={styles.searchInput}
          />
        </Stack.Toolbar.View>

        {/* Conditional buttons based on search focus */}
        <Stack.Toolbar.Button
          hidden={!showMicButton}
          icon={process.env.EXPO_OS === 'ios' ? 'mic' : micIcon}
          tintColor={Color.ios.systemGreen}
          onPress={handleMic}
        />

        {/* {isSearchFocused && (
          <Stack.Toolbar.Button
            icon="xmark.circle.fill"
            tintColor={Color.ios.systemRed}
            onPress={handleClearSearch}
          />
        )} */}

        {/* Custom view with custom component */}
        <Stack.Toolbar.View separateBackground>
          <Pressable
            testID="custom-plus-button"
            onPress={() => Alert.alert('Custom Button', 'Plus button pressed!')}
            style={styles.customButton}>
            <SymbolView
              size={22}
              tintColor={Platform.select({
                ios: Color.ios.label,
                android: Color.android.dynamic.onSurface,
              })}
              style={{
                width: 22,
                height: 22,
                transform: [{ rotate: isSearchFocused ? '45deg' : '0deg' }],
              }}
              name={{
                ios: 'plus',
                android: 'add',
              }}
            />
          </Pressable>
        </Stack.Toolbar.View>

        <ActionsMenu
          hidden={!showMenu}
          image={image2}
          emailsArchived={emailsArchived}
          onArchiveToggle={handleArchiveToggle}
          notificationsEnabled={notificationsEnabled}
          onNotificationsToggle={handleNotificationsToggle}
          favoriteColors={favoriteColors}
          onColorSelect={handleColorSelect}
        />

        {/* Xcasset button */}
        <Stack.Toolbar.Button
          hidden={!showXcassetButton}
          tintColor={Color.ios.systemTeal}
          iconRenderingMode="original"
          onPress={() => Alert.alert('Xcasset Button', 'expo-logo pressed')}>
          <Stack.Toolbar.Icon xcasset="expo-logo" />
        </Stack.Toolbar.Button>

        {/* Xcasset menu */}
        {showXcassetMenu && (
          <Stack.Toolbar.Menu title="Xcasset Menu" tintColor={Color.ios.systemTeal}>
            <Stack.Toolbar.Icon xcasset="expo-transparent" />
            <Stack.Toolbar.Label>Expo</Stack.Toolbar.Label>
            <Stack.Toolbar.MenuAction
              onPress={() => Alert.alert('Action', 'Action from xcasset menu')}>
              Xcasset Action
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        )}

        {/* Nested menu with dynamic content */}

        {/* Flexible spacer at the end */}
        <Stack.Toolbar.Spacer />
      </Stack.Toolbar>
    </>
  );
}

function ActionsMenu({
  image,
  emailsArchived,
  onArchiveToggle,
  notificationsEnabled,
  onNotificationsToggle,
  favoriteColors,
  onColorSelect,
  hidden,
}: {
  image: ReturnType<typeof useImage>;
  emailsArchived: boolean;
  onArchiveToggle: () => void;
  notificationsEnabled: boolean;
  onNotificationsToggle: () => void;
  favoriteColors: ('red' | 'blue' | 'green')[];
  onColorSelect: (color: 'red' | 'blue' | 'green') => void;
  hidden?: boolean;
}) {
  return (
    <Stack.Toolbar.Menu
      hidden={hidden}
      icon={process.env.EXPO_OS === 'ios' ? 'ellipsis.circle' : moreVertIcon}
      title="Actions"
      tintColor={Color.ios.systemBrown}>
      {/* Simple actions */}
      <Stack.Toolbar.MenuAction
        icon={process.env.EXPO_OS === 'ios' ? 'paperplane' : sendIcon}
        onPress={() => Alert.alert('Send Email', 'Email sent succesiconully!')}>
        Send email
      </Stack.Toolbar.MenuAction>
      <Stack.Toolbar.MenuAction
        icon={process.env.EXPO_OS === 'ios' ? 'trash' : deleteIcon}
        destructive
        onPress={() => Alert.alert('Delete Email', 'Email deleted!')}>
        Delete email
      </Stack.Toolbar.MenuAction>

      {/* Toggle action with isOn state */}
      <Stack.Toolbar.MenuAction
        icon={emailsArchived ? 'tray.full' : 'tray'}
        isOn={emailsArchived}
        onPress={onArchiveToggle}>
        {emailsArchived ? 'Unarchive emails' : 'Archive emails'}
      </Stack.Toolbar.MenuAction>

      {/* Nested inline menu */}
      <Stack.Toolbar.Menu inline title="Organize">
        <Stack.Toolbar.MenuAction
          icon="folder"
          onPress={() => Alert.alert('Move', 'Moving to folder...')}>
          Move to folder
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="tag" onPress={() => Alert.alert('Tag', 'Adding tag...')}>
          Add tag
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>

      {/* Nested menu with state-based selections */}
      <Stack.Toolbar.Menu title="Preferences" image={image}>
        <Stack.Toolbar.MenuAction
          icon="bell"
          isOn={notificationsEnabled}
          onPress={onNotificationsToggle}>
          {notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
        </Stack.Toolbar.MenuAction>

        {/* Color selection submenu */}
        <Stack.Toolbar.Menu inline title="Favorite Color">
          <Stack.Toolbar.MenuAction
            icon="circle.fill"
            isOn={favoriteColors.includes('red')}
            onPress={() => onColorSelect('red')}>
            Red
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="circle.fill"
            isOn={favoriteColors.includes('blue')}
            onPress={() => onColorSelect('blue')}>
            Blue
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="circle.fill"
            isOn={favoriteColors.includes('green')}
            onPress={() => onColorSelect('green')}>
            Green
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar.Menu>

      {/* Palette menu example (small icons only) */}
      <Stack.Toolbar.Menu palette inline title="Palette Actions">
        <Stack.Toolbar.MenuAction icon="star" onPress={() => Alert.alert('Star')}>
          Star-palette
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="flag" onPress={() => Alert.alert('Flag')}>
          Flag-palette
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="pin" onPress={() => Alert.alert('Pin')}>
          Pin-palette
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>

      <Stack.Toolbar.Menu inline elementSize="small" title="Small Actions">
        <Stack.Toolbar.MenuAction icon="star.fill" onPress={() => Alert.alert('Star')}>
          Star
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="flag.fill" onPress={() => Alert.alert('Flag')}>
          Flag
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="pin.fill" onPress={() => Alert.alert('Pin')}>
          Pin
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>

      {/* elementSize="medium" displays actions horizontally with titles (iOS 16+) */}
      <Stack.Toolbar.Menu inline elementSize="medium" title="Medium Size">
        <Stack.Toolbar.MenuAction icon="arrow.clockwise" onPress={() => Alert.alert('Refreshing')}>
          Refresh
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="arrow.2.circlepath" onPress={() => Alert.alert('Resuming')}>
          Resume
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="pin" onPress={() => Alert.alert('Pin')}>
          Pin
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>

      {/* elementSize="large" displays actions with larger icons and titles */}
      <Stack.Toolbar.Menu inline elementSize="large" title="Large Size">
        <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={() => Alert.alert('Sharing')}>
          Share
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="doc.on.doc" onPress={() => Alert.alert('Copying')}>
          Copy
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>

      {/* Disabled action */}
      <Stack.Toolbar.MenuAction icon="lock" disabled onPress={() => {}}>
        Locked action
      </Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>
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
  searchInput: {
    fontSize: 16,
    width: 200,
    height: process.env.EXPO_OS === 'ios' ? 32 : 48,
    paddingLeft: 8,
    color: Color.ios.label,
  },
  customButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
