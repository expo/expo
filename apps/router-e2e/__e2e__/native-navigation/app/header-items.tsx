import { Color, Label, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';

export default function HeaderItemsScreen() {
  const params = useLocalSearchParams();

  // State for controlling header items visibility
  const [showLeftButton1, setShowLeftButton1] = useState(!!params.leftButton1);
  const [showLeftButton2, setShowLeftButton2] = useState(!!params.leftButton2);
  const [leftButton2Selected, setLeftButton2Selected] = useState(false);
  const [leftButton2SeparateBackground, setLeftButton2SeparateBackground] = useState(false);
  const [showLeftCustomItem, setShowLeftCustomItem] = useState(!!params.leftCustomItem);
  const [showLeftMenu, setShowLeftMenu] = useState(!!params.leftMenu);

  const [showRightButton, setShowRightButton] = useState(!!params.rightButton);
  const [showRightMenu1, setShowRightMenu1] = useState(!!params.rightMenu1);
  const [showRightMenu2, setShowRightMenu2] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(!!params.searchButton);

  // State for menu items
  const [emailsArchived, setEmailsArchived] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'icons' | 'list'>('icons');
  const [sortBy, setSortBy] = useState<'name' | 'kind' | 'date' | 'size' | 'tags'>('name');
  const [favoriteColors, setFavoriteColors] = useState<('red' | 'blue' | 'green')[]>(['blue']);

  // State for header customization
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState('#fff');
  const [hideBackButton, setHideBackButton] = useState(false);
  const [showLargeTitleSearch, setShowLargeTitleSearch] = useState(false);

  const handleLeftButton1Press = () => {
    Alert.alert('Left Button 1', 'First left button pressed');
  };

  const handleLeftButton2Press = () => {
    Alert.alert('Left Button 2', 'Second left button pressed');
  };

  const handleRightButtonPress = () => {
    Alert.alert('Right Button', 'Right button pressed');
  };

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search button pressed');
  };

  const handleSendEmail = () => {
    Alert.alert('Send Email', 'Email sent successfully!');
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

  const handleViewModeSelect = (mode: 'icons' | 'list') => {
    setViewMode(mode);
    Alert.alert('View Mode', `Changed to ${mode} view`);
  };

  const handleSortBySelect = (sort: 'name' | 'kind' | 'date' | 'size' | 'tags') => {
    setSortBy(sort);
    Alert.alert('Sort By', `Sorting by ${sort}`);
  };

  const handleColorSelect = (color: 'red' | 'blue' | 'green') => {
    setFavoriteColors((prevColors) =>
      prevColors.includes(color) ? prevColors.filter((c) => c !== color) : [...prevColors, color]
    );
    Alert.alert('Color Selected', `You selected ${color}`);
  };

  function CustomHeaderElement() {
    return (
      <Pressable
        testID="custom-header-element"
        onPress={() => Alert.alert('Custom Element', 'Custom header element pressed!')}
        style={styles.customHeaderElement}>
        <SymbolView
          size={20}
          tintColor={Color.ios.systemBlue}
          style={{ width: 20, height: 20 }}
          name="heart.fill"
        />
      </Pressable>
    );
  }

  return (
    <>
      <Stack.Screen>
        <Stack.Header style={{ backgroundColor: headerBackgroundColor }}>
          <Stack.Header.BackButton hidden={hideBackButton} />
          <Stack.Header.Title>Header Items Test</Stack.Header.Title>

          {/* Left header items */}
          <Stack.Header.Left>
            {/* TODO: Hidden prop is missing for bar items */}
            {showLeftButton1 && (
              <Stack.Header.Button icon="arrow.left" onPress={handleLeftButton1Press} />
            )}
            {showLeftButton2 && (
              <Stack.Header.Button
                separateBackground={leftButton2SeparateBackground}
                selected={leftButton2Selected}
                onPress={handleLeftButton2Press}
                style={{
                  fontWeight: 500,
                  fontSize: 10,
                  color: '#f0f',
                }}>
                <Stack.Header.Label>Button 2</Stack.Header.Label>
                <Stack.Header.Icon sf="star" />
                <Stack.Header.Badge>33</Stack.Header.Badge>
              </Stack.Header.Button>
            )}

            {showLeftCustomItem && (
              <Stack.Header.Item>
                <CustomHeaderElement />
              </Stack.Header.Item>
            )}

            {showLeftMenu && (
              <Stack.Header.Menu
                style={{
                  color: '#00f',
                  fontFamily: 'Arial',
                }}>
                <Stack.Header.Label>Left Menu</Stack.Header.Label>
                <Stack.Header.Icon sf="list.bullet" />
                <Stack.Header.Badge
                  style={{
                    backgroundColor: '#eee',
                    fontFamily: 'Courier New',
                    fontWeight: 100,
                  }}>
                  99
                </Stack.Header.Badge>
                <Stack.Header.MenuAction onPress={() => Alert.alert('Option 1')}>
                  <Stack.Header.Label>Option 1</Stack.Header.Label>
                  <Stack.Header.Icon sf="1.circle" />
                </Stack.Header.MenuAction>
                <Stack.Header.MenuAction isOn onPress={() => Alert.alert('Option 2')}>
                  <Stack.Header.Label>Option 2</Stack.Header.Label>
                  <Stack.Header.Icon sf="2.circle" />
                </Stack.Header.MenuAction>
              </Stack.Header.Menu>
            )}
          </Stack.Header.Left>

          {/* Right header items */}
          <Stack.Header.Right>
            {showRightMenu1 && (
              <Stack.Header.Menu
                icon="ellipsis.circle"
                title="Actions"
                style={{
                  color: '#00f',
                  fontFamily: 'Arial',
                }}>
                <Stack.Header.Label>Menu</Stack.Header.Label>
                <Stack.Header.Badge
                  style={{
                    backgroundColor: '#eee',
                    fontFamily: 'Courier New',
                    fontWeight: 100,
                  }}>
                  99
                </Stack.Header.Badge>

                {/* Simple actions */}
                <Stack.Header.MenuAction onPress={handleSendEmail}>
                  <Stack.Header.Label>Send email</Stack.Header.Label>
                  <Stack.Header.Icon sf="paperplane" />
                </Stack.Header.MenuAction>
                <Stack.Header.MenuAction destructive onPress={handleDeleteEmail}>
                  <Stack.Header.Label>Delete email</Stack.Header.Label>
                  <Stack.Header.Icon sf="trash" />
                </Stack.Header.MenuAction>

                {/* Toggle action */}
                <Stack.Header.MenuAction isOn={emailsArchived} onPress={handleArchiveToggle}>
                  <Stack.Header.Label>
                    {emailsArchived ? 'Unarchive emails' : 'Archive emails'}
                  </Stack.Header.Label>
                  <Stack.Header.Icon sf={emailsArchived ? 'tray.full' : 'tray'} />
                </Stack.Header.MenuAction>

                {/* Nested inline menu - View mode */}
                <Stack.Header.Menu inline>
                  <Stack.Header.Label>View Mode</Stack.Header.Label>
                  <Stack.Header.MenuAction
                    isOn={viewMode === 'icons'}
                    onPress={() => handleViewModeSelect('icons')}>
                    <Stack.Header.Label>Icons</Stack.Header.Label>
                    <Stack.Header.Icon sf="square.grid.2x2" />
                  </Stack.Header.MenuAction>
                  <Stack.Header.MenuAction
                    isOn={viewMode === 'list'}
                    onPress={() => handleViewModeSelect('list')}>
                    <Stack.Header.Label>List</Stack.Header.Label>
                    <Stack.Header.Icon sf="list.bullet" />
                  </Stack.Header.MenuAction>
                </Stack.Header.Menu>

                {/* Nested inline menu - Sort by */}
                <Stack.Header.Menu inline>
                  <Stack.Header.Label>Sort By</Stack.Header.Label>
                  <Stack.Header.MenuAction
                    isOn={sortBy === 'name'}
                    subtitle="Ascending"
                    onPress={() => handleSortBySelect('name')}>
                    Name
                  </Stack.Header.MenuAction>
                  <Stack.Header.MenuAction
                    isOn={sortBy === 'kind'}
                    onPress={() => handleSortBySelect('kind')}>
                    Kind
                  </Stack.Header.MenuAction>
                  <Stack.Header.MenuAction
                    isOn={sortBy === 'date'}
                    onPress={() => handleSortBySelect('date')}>
                    Date
                  </Stack.Header.MenuAction>
                  <Stack.Header.MenuAction
                    isOn={sortBy === 'size'}
                    onPress={() => handleSortBySelect('size')}>
                    Size
                  </Stack.Header.MenuAction>
                  <Stack.Header.MenuAction
                    isOn={sortBy === 'tags'}
                    onPress={() => handleSortBySelect('tags')}>
                    Tags
                  </Stack.Header.MenuAction>
                </Stack.Header.Menu>

                {/* Nested menu - Preferences */}
                <Stack.Header.Menu title="Preferences">
                  <Stack.Header.MenuAction
                    isOn={notificationsEnabled}
                    onPress={handleNotificationsToggle}>
                    <Stack.Header.Label>
                      {notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                    </Stack.Header.Label>
                    <Stack.Header.Icon sf="bell" />
                  </Stack.Header.MenuAction>

                  {/* Color selection submenu */}
                  <Stack.Header.Menu inline title="Favorite Color">
                    <Stack.Header.MenuAction
                      isOn={favoriteColors.includes('red')}
                      onPress={() => handleColorSelect('red')}>
                      <Stack.Header.Label>Red</Stack.Header.Label>
                      <Stack.Header.Icon sf="circle.fill" />
                    </Stack.Header.MenuAction>
                    <Stack.Header.MenuAction
                      isOn={favoriteColors.includes('blue')}
                      onPress={() => handleColorSelect('blue')}>
                      <Stack.Header.Label>Blue</Stack.Header.Label>
                      <Stack.Header.Icon sf="circle.fill" />
                    </Stack.Header.MenuAction>
                    <Stack.Header.MenuAction
                      isOn={favoriteColors.includes('green')}
                      onPress={() => handleColorSelect('green')}>
                      <Stack.Header.Label>Green</Stack.Header.Label>
                      <Stack.Header.Icon sf="circle.fill" />
                    </Stack.Header.MenuAction>
                  </Stack.Header.Menu>
                </Stack.Header.Menu>

                {/* Palette menu */}
                <Stack.Header.Menu palette destructive title="quick-actions">
                  <Label>Quick Actions</Label>
                  <Stack.Header.MenuAction isOn icon="star" onPress={() => Alert.alert('Star')}>
                    Star
                  </Stack.Header.MenuAction>
                  <Stack.Header.MenuAction icon="flag" onPress={() => Alert.alert('Flag')}>
                    Flag
                  </Stack.Header.MenuAction>
                  <Stack.Header.MenuAction icon="pin" onPress={() => Alert.alert('Pin')}>
                    Pin
                  </Stack.Header.MenuAction>
                </Stack.Header.Menu>

                {/* Disabled action */}
                <Stack.Header.MenuAction disabled onPress={() => {}}>
                  <Stack.Header.Label>Locked action</Stack.Header.Label>
                  <Stack.Header.Icon sf="lock" />
                </Stack.Header.MenuAction>
              </Stack.Header.Menu>
            )}

            {showRightMenu2 && (
              <Stack.Header.Menu title="second-menu">
                <Stack.Header.Label>Second</Stack.Header.Label>
              </Stack.Header.Menu>
            )}

            {showRightButton && (
              <Stack.Header.Button style={{ color: 'green' }} onPress={handleRightButtonPress}>
                Right
              </Stack.Header.Button>
            )}

            {showSearchButton && (
              <Stack.Header.Button icon="magnifyingglass" onPress={handleSearchPress} />
            )}
          </Stack.Header.Right>
        </Stack.Header>
      </Stack.Screen>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Stack Header Items E2E Test Screen</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Left Header Items</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Left Button 1</Text>
            <Switch
              testID="toggle-left-button-1"
              value={showLeftButton1}
              onValueChange={setShowLeftButton1}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Left Button 2</Text>
            <Switch
              testID="toggle-left-button-2"
              value={showLeftButton2}
              onValueChange={setShowLeftButton2}
            />
          </View>

          {showLeftButton2 && (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Left Button 2 Selected</Text>
                <Switch
                  testID="toggle-left-button-2-selected"
                  value={leftButton2Selected}
                  onValueChange={setLeftButton2Selected}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Left Button 2 Separate Background</Text>
                <Switch
                  testID="toggle-left-button-2-separate-background"
                  value={leftButton2SeparateBackground}
                  onValueChange={setLeftButton2SeparateBackground}
                />
              </View>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Left Custom Item</Text>
            <Switch
              testID="toggle-left-custom-item"
              value={showLeftCustomItem}
              onValueChange={setShowLeftCustomItem}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Left Menu</Text>
            <Switch
              testID="toggle-left-menu"
              value={showLeftMenu}
              onValueChange={setShowLeftMenu}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Right Header Items</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Right Menu 1</Text>
            <Switch
              testID="toggle-right-menu-1"
              value={showRightMenu1}
              onValueChange={setShowRightMenu1}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Right Menu 2</Text>
            <Switch
              testID="toggle-right-menu-2"
              value={showRightMenu2}
              onValueChange={setShowRightMenu2}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Right Button</Text>
            <Switch
              testID="toggle-right-button"
              value={showRightButton}
              onValueChange={setShowRightButton}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Search Button</Text>
            <Switch
              testID="toggle-search-button"
              value={showSearchButton}
              onValueChange={setShowSearchButton}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Header Customization</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Hide Back Button</Text>
            <Switch
              testID="toggle-hide-back-button"
              value={hideBackButton}
              onValueChange={setHideBackButton}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Header Background Color</Text>
            <View style={styles.colorButtonsRow}>
              <Pressable
                testID="color-white"
                style={[styles.colorButton, { backgroundColor: '#fff' }]}
                onPress={() => setHeaderBackgroundColor('#fff')}
              />
              <Pressable
                testID="color-transparent"
                style={[styles.colorButton, { backgroundColor: 'transparent', borderWidth: 1 }]}
                onPress={() => setHeaderBackgroundColor('transparent')}
              />
              <Pressable
                testID="color-blue"
                style={[styles.colorButton, { backgroundColor: '#007AFF' }]}
                onPress={() => setHeaderBackgroundColor('#007AFF')}
              />
              <Pressable
                testID="color-red"
                style={[styles.colorButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => setHeaderBackgroundColor('#FF3B30')}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current State</Text>
          <Text style={styles.stateText}>View Mode: {viewMode}</Text>
          <Text style={styles.stateText}>Sort By: {sortBy}</Text>
          <Text style={styles.stateText}>Emails Archived: {emailsArchived ? 'Yes' : 'No'}</Text>
          <Text style={styles.stateText}>
            Notifications: {notificationsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.stateText}>Favorite Colors: {favoriteColors.join(', ')}</Text>
          <Text style={styles.stateText}>Header Background: {headerBackgroundColor}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instruction}>1. Toggle switches above to show/hide header items</Text>
          <Text style={styles.instruction}>2. Test left and right header buttons</Text>
          <Text style={styles.instruction}>3. Test nested menus and submenus</Text>
          <Text style={styles.instruction}>4. Test menu item states (selected, disabled)</Text>
          <Text style={styles.instruction}>5. Test custom header element and badge displays</Text>
          <Text style={styles.instruction}>6. Test palette menu and destructive actions</Text>
          <Text style={styles.instruction}>7. Observe state changes reflected in menu items</Text>
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
    flex: 1,
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
  customHeaderElement: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
