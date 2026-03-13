import { useImage } from 'expo-image';
import { Color, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, useRef } from 'react';
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

  const handleSendEmail = () => {
    Alert.alert('Send Email', 'Email sent succesiconully!');
  };

  const handleDeleteEmail = () => {
    Alert.alert('Delete Email', 'Email deleted!');
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

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Search Bar</Text>
            <Switch
              testID="toggle-search-bar"
              value={showSearchBar}
              onValueChange={setShowSearchBar}
            />
          </View>

          {showSearchBar && (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Search Bar Shares Background</Text>
                <Switch
                  testID="toggle-search-bar-share-background"
                  value={sharesBackgroundSearchBar}
                  onValueChange={setSharesBackgroundSearchBar}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Search Bar Hides Shared Background</Text>
                <Switch
                  testID="toggle-search-bar-hide-shared-background"
                  value={hidesSharedBackgroundSearchBar}
                  onValueChange={setHidesSharedBackgroundSearchBar}
                />
              </View>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Search Button</Text>
            <Switch
              testID="toggle-search-button"
              value={showSearchButton}
              onValueChange={setShowSearchButton}
            />
          </View>

          {showSearchButton && (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Search Shares Background</Text>
                <Switch
                  testID="toggle-search-button-share-background"
                  value={sharesBackgroundSearchButton}
                  onValueChange={setSharesBackgroundSearchButton}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Search Hides Shared Background</Text>
                <Switch
                  testID="toggle-search-button-hide-shared-background"
                  value={hidesSharedBackgroundSearchButton}
                  onValueChange={setHidesSharedBackgroundSearchButton}
                />
              </View>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Mic Button</Text>
            <Switch
              testID="toggle-mic-button"
              value={showMicButton}
              onValueChange={setShowMicButton}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Custom View</Text>
            <Switch
              testID="toggle-custom-view"
              value={showCustomView}
              onValueChange={setShowCustomView}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Menu</Text>
            <Switch testID="toggle-menu" value={showMenu} onValueChange={setShowMenu} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Xcasset Button</Text>
            <Switch
              testID="toggle-xcasset-button"
              value={showXcassetButton}
              onValueChange={setShowXcassetButton}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Xcasset Menu</Text>
            <Switch
              testID="toggle-xcasset-menu"
              value={showXcassetMenu}
              onValueChange={setShowXcassetMenu}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Fixed Spacer (20pt)</Text>
            <Switch
              testID="toggle-fixed-spacer"
              value={showFixedSpacer}
              onValueChange={setShowFixedSpacer}
            />
          </View>

          {showFixedSpacer && (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Fixed Spacer Shares Background</Text>
                <Switch
                  testID="toggle-fixed-spacer-share-background"
                  value={fixedSpacerShareBackground}
                  onValueChange={setFixedSpacerShareBackground}
                />
              </View>

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

      <Stack.Toolbar>
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
          icon="magnifyingglass"
          tintColor={Color.ios.systemBlue}
          onPress={handleSearch}
          separateBackground={!sharesBackgroundSearchButton}
          hidesSharedBackground={hidesSharedBackgroundSearchButton}
        />

        <Stack.Toolbar.Button image={image} />

        {/* Fixed width spacer */}
        {showFixedSpacer && (
          <Stack.Toolbar.Spacer
            // hidden={!showFixedSpacer}
            sharesBackground={fixedSpacerShareBackground}
            width={fixedSpacerWidth}
          />
        )}

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
        {!isSearchFocused && (
          <Stack.Toolbar.Button
            hidden={!showMicButton}
            icon="mic"
            tintColor={Color.ios.systemGreen}
            onPress={handleMic}
          />
        )}

        {isSearchFocused && (
          <Stack.Toolbar.Button
            icon="xmark.circle.fill"
            tintColor={Color.ios.systemRed}
            onPress={handleClearSearch}
          />
        )}

        {/* Custom view with custom component */}
        <Stack.Toolbar.View separateBackground>
          <Pressable
            testID="custom-plus-button"
            onPress={() => Alert.alert('Custom Button', 'Plus button pressed!')}
            style={styles.customButton}>
            <SymbolView
              size={22}
              tintColor={Color.ios.label}
              style={{
                width: 22,
                height: 22,
                transform: [{ rotate: isSearchFocused ? '45deg' : '0deg' }],
              }}
              name="plus"
            />
          </Pressable>
        </Stack.Toolbar.View>

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
        {showMenu && (
          <Stack.Toolbar.Menu
            icon="ellipsis.circle"
            title="Actions"
            tintColor={Color.ios.systemBrown}>
            {/* Simple actions */}
            <Stack.Toolbar.MenuAction icon="paperplane" onPress={handleSendEmail}>
              Send email
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction icon="trash" destructive onPress={handleDeleteEmail}>
              Delete email
            </Stack.Toolbar.MenuAction>

            {/* Toggle action with isOn state */}
            <Stack.Toolbar.MenuAction
              icon={emailsArchived ? 'tray.full' : 'tray'}
              isOn={emailsArchived}
              onPress={handleArchiveToggle}>
              {emailsArchived ? 'Unarchive emails' : 'Archive emails'}
            </Stack.Toolbar.MenuAction>

            {/* Nested inline menu */}
            <Stack.Toolbar.Menu inline title="Organize">
              <Stack.Toolbar.MenuAction
                icon="folder"
                onPress={() => Alert.alert('Move', 'Moving to folder...')}>
                Move to folder
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction
                icon="tag"
                onPress={() => Alert.alert('Tag', 'Adding tag...')}>
                Add tag
              </Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>

            {/* Nested menu with state-based selections */}
            <Stack.Toolbar.Menu title="Preferences" image={image2}>
              <Stack.Toolbar.MenuAction
                icon="bell"
                isOn={notificationsEnabled}
                onPress={handleNotificationsToggle}>
                {notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              </Stack.Toolbar.MenuAction>

              {/* Color selection submenu */}
              <Stack.Toolbar.Menu inline title="Favorite Color">
                <Stack.Toolbar.MenuAction
                  icon="circle.fill"
                  isOn={favoriteColors.includes('red')}
                  onPress={() => handleColorSelect('red')}>
                  Red
                </Stack.Toolbar.MenuAction>
                <Stack.Toolbar.MenuAction
                  icon="circle.fill"
                  isOn={favoriteColors.includes('blue')}
                  onPress={() => handleColorSelect('blue')}>
                  Blue
                </Stack.Toolbar.MenuAction>
                <Stack.Toolbar.MenuAction
                  icon="circle.fill"
                  isOn={favoriteColors.includes('green')}
                  onPress={() => handleColorSelect('green')}>
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
              <Stack.Toolbar.MenuAction
                icon="arrow.clockwise"
                onPress={() => Alert.alert('Refreshing')}>
                Refresh
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction
                icon="arrow.2.circlepath"
                onPress={() => Alert.alert('Resuming')}>
                Resume
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction icon="pin" onPress={() => Alert.alert('Pin')}>
                Pin
              </Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>

            {/* elementSize="large" displays actions with larger icons and titles */}
            <Stack.Toolbar.Menu inline elementSize="large" title="Large Size">
              <Stack.Toolbar.MenuAction
                icon="square.and.arrow.up"
                onPress={() => Alert.alert('Sharing')}>
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
        )}

        {/* Flexible spacer at the end */}
        <Stack.Toolbar.Spacer />
      </Stack.Toolbar>
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
    height: 32,
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
