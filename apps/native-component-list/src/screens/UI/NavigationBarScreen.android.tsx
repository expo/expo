import {
  Box,
  Column,
  Host,
  Icon,
  NavigationBar,
  NavigationBarItem,
  Surface,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { align, fillMaxSize, fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const mailIcon = require('../../../assets/icons/ui/mail.xml');
const personIcon = require('../../../assets/icons/ui/person.xml');
const wifiIcon = require('../../../assets/icons/ui/wifi.xml');

const tabs = [
  { key: 'mail', label: 'Mail', icon: mailIcon },
  { key: 'profile', label: 'Profile', icon: personIcon },
  { key: 'network', label: 'Network', icon: wifiIcon },
] as const;

export default function NavigationBarScreen() {
  const [selectedTab, setSelectedTab] = React.useState<(typeof tabs)[number]['key']>('mail');
  const selected = tabs.find((tab) => tab.key === selectedTab) ?? tabs[0];

  return (
    <Host style={{ flex: 1 }}>
      <Box modifiers={[fillMaxSize()]}>
        <Surface modifiers={[fillMaxSize()]}>
          <Column
            horizontalAlignment="center"
            verticalArrangement={{ spacedBy: 16 }}
            modifiers={[fillMaxWidth(), padding(24, 32, 24, 120)]}>
            <Icon source={selected.icon} size={48} />
            <ComposeText style={{ typography: 'headlineSmall' }}>{selected.label}</ComposeText>
            <ComposeText style={{ typography: 'bodyMedium' }}>
              Tap a destination in the navigation bar.
            </ComposeText>
          </Column>
        </Surface>

        <NavigationBar modifiers={[align('bottomCenter'), fillMaxWidth()]}>
          {tabs.map((tab) => (
            <NavigationBarItem
              key={tab.key}
              selected={selectedTab === tab.key}
              onClick={() => setSelectedTab(tab.key)}>
              <NavigationBarItem.Icon>
                <Icon source={tab.icon} size={24} />
              </NavigationBarItem.Icon>
              <NavigationBarItem.SelectedIcon>
                <Icon source={tab.icon} size={24} />
              </NavigationBarItem.SelectedIcon>
              <NavigationBarItem.Label>
                <ComposeText>{tab.label}</ComposeText>
              </NavigationBarItem.Label>
            </NavigationBarItem>
          ))}
        </NavigationBar>
      </Box>
    </Host>
  );
}

NavigationBarScreen.navigationOptions = {
  title: 'NavigationBar',
};
