import { Color, Stack, useLocalSearchParams } from 'expo-router';
import { Toolbar } from 'expo-router/unstable-toolbar';
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
  const [showFixedSpacer, setShowFixedSpacer] = useState(false);
  const [fixedSpacerShareBackground, setFixedSpacerShareBackground] = useState(false);
  const [fixedSpacerHideSharedBackground, setFixedSpacerHideSharedBackground] = useState(false);
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

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Toolbar E2E Test Screen</Text>
        <Stack.Header />
        <Stack.SearchBar
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onChangeText={(e) => setSearchText(e.nativeEvent.text)}
          placement="integratedButton"
          placeholder="This is toolbar searchbar"
        />

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
                <Text style={styles.label}>Fixed Spacer Hides Shared Background</Text>
                <Switch
                  testID="toggle-fixed-spacer-hide-shared-background"
                  value={fixedSpacerHideSharedBackground}
                  onValueChange={setFixedSpacerHideSharedBackground}
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

      <Toolbar>
        {/* Flexible spacer at the start */}
        <Toolbar.Spacer />

        {/* Search bar */}
        <Toolbar.SearchBarPlacement
          hidden={!showSearchBar}
          sharesBackground={sharesBackgroundSearchBar}
          hidesSharedBackground={hidesSharedBackgroundSearchBar}
        />

        {/* Search button */}
        <Toolbar.Button
          hidden={!showSearchButton}
          icon="magnifyingglass"
          tintColor={Color.ios.systemBlue}
          onPress={handleSearch}
          separateBackground={!sharesBackgroundSearchButton}
          hidesSharedBackground={hidesSharedBackgroundSearchButton}
        />

        {/* Fixed width spacer */}
        {showFixedSpacer && (
          <Toolbar.Spacer
            // hidden={!showFixedSpacer}
            sharesBackground={fixedSpacerShareBackground}
            hidesSharedBackground={fixedSpacerHideSharedBackground}
            width={fixedSpacerWidth}
          />
        )}

        {/* Custom view with TextInput */}
        <Toolbar.View style={{ width: 200 }} hidden={!showCustomView}>
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
        </Toolbar.View>

        {/* Conditional buttons based on search focus */}
        {!isSearchFocused && (
          <Toolbar.Button
            hidden={!showMicButton}
            icon="mic"
            tintColor={Color.ios.systemGreen}
            onPress={handleMic}
          />
        )}

        {isSearchFocused && (
          <Toolbar.Button
            icon="xmark.circle.fill"
            tintColor={Color.ios.systemRed}
            onPress={handleClearSearch}
          />
        )}

        {/* Custom view with custom component */}
        <Toolbar.View separateBackground style={{ width: 32, height: 32 }}>
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
        </Toolbar.View>

        {/* Nested menu with dynamic content */}
        {showMenu && (
          <Toolbar.Menu icon="ellipsis.circle" title="Actions" tintColor={Color.ios.systemBrown}>
            {/* Simple actions */}
            <Toolbar.MenuAction icon="paperplane" title="Send email" onPress={handleSendEmail} />
            <Toolbar.MenuAction
              icon="trash"
              title="Delete email"
              destructive
              onPress={handleDeleteEmail}
            />

            {/* Toggle action with isOn state */}
            <Toolbar.MenuAction
              icon={emailsArchived ? 'tray.full' : 'tray'}
              title={emailsArchived ? 'Unarchive emails' : 'Archive emails'}
              isOn={emailsArchived}
              onPress={handleArchiveToggle}
            />

            {/* Nested inline menu */}
            <Toolbar.Menu inline title="Organize">
              <Toolbar.MenuAction
                icon="folder"
                title="Move to folder"
                onPress={() => Alert.alert('Move', 'Moving to folder...')}
              />
              <Toolbar.MenuAction
                icon="tag"
                title="Add tag"
                onPress={() => Alert.alert('Tag', 'Adding tag...')}
              />
            </Toolbar.Menu>

            {/* Nested menu with state-based selections */}
            <Toolbar.Menu title="Preferences">
              <Toolbar.MenuAction
                icon="bell"
                title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                isOn={notificationsEnabled}
                onPress={handleNotificationsToggle}
              />

              {/* Color selection submenu */}
              <Toolbar.Menu inline title="Favorite Color">
                <Toolbar.MenuAction
                  icon="circle.fill"
                  title="Red"
                  isOn={favoriteColors.includes('red')}
                  onPress={() => handleColorSelect('red')}
                />
                <Toolbar.MenuAction
                  icon="circle.fill"
                  title="Blue"
                  isOn={favoriteColors.includes('blue')}
                  onPress={() => handleColorSelect('blue')}
                />
                <Toolbar.MenuAction
                  icon="circle.fill"
                  title="Green"
                  isOn={favoriteColors.includes('green')}
                  onPress={() => handleColorSelect('green')}
                />
              </Toolbar.Menu>
            </Toolbar.Menu>

            {/* Palette menu example (small icons only) */}
            <Toolbar.Menu palette inline title="Palette Actions">
              <Toolbar.MenuAction
                icon="star"
                title="Star-palette"
                onPress={() => Alert.alert('Star')}
              />
              <Toolbar.MenuAction
                icon="flag"
                title="Flag-palette"
                onPress={() => Alert.alert('Flag')}
              />
              <Toolbar.MenuAction
                icon="pin"
                title="Pin-palette"
                onPress={() => Alert.alert('Pin')}
              />
            </Toolbar.Menu>

            <Toolbar.Menu inline elementSize="small" title="Small Actions">
              <Toolbar.MenuAction icon="star.fill" onPress={() => Alert.alert('Star')}>
                Star
              </Toolbar.MenuAction>
              <Toolbar.MenuAction icon="flag.fill" onPress={() => Alert.alert('Flag')}>
                Flag
              </Toolbar.MenuAction>
              <Toolbar.MenuAction icon="pin.fill" onPress={() => Alert.alert('Pin')}>
                Pin
              </Toolbar.MenuAction>
            </Toolbar.Menu>

            {/* elementSize="medium" displays actions horizontally with titles (iOS 16+) */}
            <Toolbar.Menu inline elementSize="medium" title="Medium Size">
              <Toolbar.MenuAction
                icon="arrow.clockwise"
                title="Refresh"
                onPress={() => Alert.alert('Refreshing')}
              />
              <Toolbar.MenuAction
                icon="arrow.2.circlepath"
                title="Resume"
                onPress={() => Alert.alert('Resuming')}
              />
              <Toolbar.MenuAction icon="pin" title="Pin" onPress={() => Alert.alert('Pin')} />
            </Toolbar.Menu>

            {/* elementSize="large" displays actions with larger icons and titles */}
            <Toolbar.Menu inline elementSize="large" title="Large Size">
              <Toolbar.MenuAction
                icon="square.and.arrow.up"
                title="Share"
                onPress={() => Alert.alert('Sharing')}
              />
              <Toolbar.MenuAction
                icon="doc.on.doc"
                title="Copy"
                onPress={() => Alert.alert('Copying')}
              />
            </Toolbar.Menu>

            {/* Disabled action */}
            <Toolbar.MenuAction icon="lock" title="Locked action" disabled onPress={() => {}} />
          </Toolbar.Menu>
        )}

        {/* Flexible spacer at the end */}
        <Toolbar.Spacer />
      </Toolbar>
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
    color: Color.ios.label,
  },
  customButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
