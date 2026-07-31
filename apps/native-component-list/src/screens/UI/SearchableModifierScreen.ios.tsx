import { Host, List, Section, Text, useNativeState } from '@expo/ui/swift-ui';
import { searchable } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

const settings = [
  'Airplane Mode',
  'Wi-Fi',
  'Bluetooth',
  'Cellular',
  'Personal Hotspot',
  'Battery',
  'General',
  'Accessibility',
  'Action Button',
  'Camera',
  'Control Center',
  'Display & Brightness',
  'Home Screen & App Library',
  'Search',
  'StandBy',
  'Wallpaper',
  'Notifications',
  'Sounds & Haptics',
  'Focus',
  'Screen Time',
  'Face ID & Passcode',
  'Emergency SOS',
  'Privacy & Security',
  'Game Center',
  'iCloud',
  'Wallet & Apple Pay',
  'Apps',
  'Developer',
  'VPN',
  'Apple Intelligence & Siri',
];

export default function SearchableModifierScreen() {
  const searchText = useNativeState('');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredSettings = normalizedQuery
    ? settings.filter((setting) => setting.toLocaleLowerCase().includes(normalizedQuery))
    : settings;

  return (
    <Host style={{ flex: 1 }}>
      <List
        modifiers={[
          searchable(searchText, {
            placement: {
              kind: 'navigationBarDrawer',
              displayMode: 'always',
            },
            prompt: 'Search settings',
            onChange: setQuery,
          }),
        ]}>
        {filteredSettings.length > 0 ? (
          <Section
            title={
              normalizedQuery
                ? `${filteredSettings.length} ${filteredSettings.length === 1 ? 'Result' : 'Results'}`
                : 'Settings'
            }>
            {filteredSettings.map((setting) => (
              <Text key={setting}>{setting}</Text>
            ))}
          </Section>
        ) : (
          <Section title="No Results">
            <Text>{`No settings match "${query}"`}</Text>
          </Section>
        )}
      </List>
    </Host>
  );
}
