import {
  Button,
  Checkbox,
  DropdownMenu,
  HorizontalDivider,
  DropdownMenuItem,
  Host,
  Icon,
  Row,
  Switch,
  Text as ComposeText,
  FilledTonalButton,
  OutlinedButton,
} from '@expo/ui/jetpack-compose';
import { background } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { View, Text } from 'react-native';

import { Section } from '../../components/Page';

// This are random icons used for testing. Feel free to replace them with more fitting icons if needed.
const faceIcon = require('../../../assets/icons/api/Camera.png');
const profileIcon = require('../../../assets/icons/api/Contacts.png');
const favoriteIcon = require('../../../assets/icons/api/Haptic.png');
const checkIcon = require('../../../assets/icons/api/KeepAwake.png');
const homeIcon = require('../../../assets/icons/api/Location.png');
const notificationIcon = require('../../../assets/icons/api/Notification.png');
const printIcon = require('../../../assets/icons/api/Print.png');
const darkModeIcon = require('../../../assets/icons/api/ScreenOrientation.png');
const logoutIcon = require('../../../assets/icons/api/SecureStore.png');
const settingsIcon = require('../../../assets/icons/api/Sensor.png');
const starIcon = require('../../../assets/icons/api/StoreReview.png');

export default function DropdownMenuScreen() {
  const [switchChecked, setSwitchChecked] = React.useState<boolean>(true);
  const [switch2Checked, setSwitch2Checked] = React.useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = React.useState<'Light' | 'Dark' | 'Auto'>('Auto');
  const [themeMenuExpanded, setThemeMenuExpanded] = React.useState(false);
  const [colorfulMenuExpanded, setColorfulMenuExpanded] = React.useState(false);
  const [sectionsMenuExpanded, setSectionsMenuExpanded] = React.useState(false);
  const [submenuExpanded, setSubmenuExpanded] = React.useState(false);

  React.useEffect(() => {
    if (sectionsMenuExpanded === false) {
      setSubmenuExpanded(false);
    }
  }, [sectionsMenuExpanded]);

  const themeBackgroundColor = selectedTheme === 'Dark' ? 'black' : 'white';

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Section title="Theme Dropdown Menu">
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Theme</Text>
          <Host matchContents>
            <DropdownMenu
              expanded={themeMenuExpanded}
              onDismissRequest={() => setThemeMenuExpanded(false)}
              color={themeBackgroundColor}>
              <DropdownMenu.Trigger>
                <Button
                  colors={{ containerColor: 'transparent', contentColor: 'blue' }}
                  onClick={() => setThemeMenuExpanded(true)}>
                  <ComposeText>{selectedTheme}</ComposeText>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Items>
                <DropdownMenuItem
                  onClick={() => {
                    setThemeMenuExpanded(false);
                    setSelectedTheme('Light');
                  }}>
                  <DropdownMenuItem.Text>
                    <ComposeText>Light</ComposeText>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={starIcon} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                  {selectedTheme === 'Light' && (
                    <DropdownMenuItem.TrailingIcon>
                      <Icon source={checkIcon} size={24} />
                    </DropdownMenuItem.TrailingIcon>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setThemeMenuExpanded(false);
                    setSelectedTheme('Dark');
                  }}>
                  <DropdownMenuItem.Text>
                    <ComposeText>Dark</ComposeText>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={faceIcon} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                  {selectedTheme === 'Dark' && (
                    <DropdownMenuItem.TrailingIcon>
                      <Icon source={checkIcon} size={24} />
                    </DropdownMenuItem.TrailingIcon>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setThemeMenuExpanded(false);
                    setSelectedTheme('Auto');
                  }}>
                  <DropdownMenuItem.Text>
                    <ComposeText>Auto</ComposeText>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={settingsIcon} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                  {selectedTheme === 'Auto' && (
                    <DropdownMenuItem.TrailingIcon>
                      <Icon source={checkIcon} size={24} />
                    </DropdownMenuItem.TrailingIcon>
                  )}
                </DropdownMenuItem>
              </DropdownMenu.Items>
            </DropdownMenu>
          </Host>
        </View>
      </Section>
      <Section title="Colorful Dropdown Menu">
        <Host matchContents>
          <DropdownMenu
            expanded={colorfulMenuExpanded}
            onDismissRequest={() => setColorfulMenuExpanded(false)}
            color="#e3b7ff">
            <DropdownMenu.Trigger>
              <FilledTonalButton onClick={() => setColorfulMenuExpanded(true)}>
                <ComposeText>Show Colorful Menu</ComposeText>
              </FilledTonalButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Items>
              <DropdownMenuItem
                onClick={() => setColorfulMenuExpanded(false)}
                elementColors={{ textColor: '#FFFFFF' }}
                modifiers={[background('#FF0000')]}>
                <DropdownMenuItem.Text>
                  <ComposeText>I'm red</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={favoriteIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setColorfulMenuExpanded(false)}
                elementColors={{ textColor: '#00ff00' }}
                modifiers={[background('#FFFFFF')]}>
                <DropdownMenuItem.Text>
                  <ComposeText>My text is green!</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon tintColor="#ff0000" source={starIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
                <DropdownMenuItem.TrailingIcon>
                  <Icon tintColor="#0000ff" source={checkIcon} size={24} />
                </DropdownMenuItem.TrailingIcon>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setColorfulMenuExpanded(false)}>
                <DropdownMenuItem.Text>
                  <Row verticalAlignment="center">
                    <ComposeText>I'm very colorful!</ComposeText>
                    <Checkbox
                      value={switchChecked}
                      colors={{
                        checkedColor: '#ff0000',
                        disabledCheckedColor: '#00ff00',
                        uncheckedColor: '#0000ff',
                        checkmarkColor: '#ffff00',
                      }}
                      onCheckedChange={setSwitchChecked}
                    />
                  </Row>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setColorfulMenuExpanded(false)}>
                <DropdownMenuItem.Text>
                  <Row verticalAlignment="center">
                    <ComposeText>Switches can be colorful too!</ComposeText>
                    <Switch
                      value={switch2Checked}
                      onCheckedChange={setSwitch2Checked}
                      colors={{
                        checkedThumbColor: '#ff0000',
                        checkedTrackColor: '#00ff00',
                        uncheckedThumbColor: '#0000ff',
                        uncheckedTrackColor: '#ffff00',
                      }}
                    />
                  </Row>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            </DropdownMenu.Items>
          </DropdownMenu>
        </Host>
      </Section>
      <Section title="Dropdown Menu with Sections">
        <Host matchContents>
          <DropdownMenu
            expanded={sectionsMenuExpanded}
            onDismissRequest={() => setSectionsMenuExpanded(false)}>
            <DropdownMenu.Trigger>
              <OutlinedButton onClick={() => setSectionsMenuExpanded(true)}>
                <ComposeText>Show Menu with Sections</ComposeText>
              </OutlinedButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Items>
              <DropdownMenuItem
                onClick={() => {
                  setSectionsMenuExpanded(false);
                  console.log('Home pressed');
                }}>
                <DropdownMenuItem.Text>
                  <ComposeText>Home</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={homeIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <HorizontalDivider />
              <DropdownMenu
                expanded={submenuExpanded}
                onDismissRequest={() => setSubmenuExpanded(false)}>
                <DropdownMenu.Trigger>
                  <DropdownMenuItem onClick={() => setSubmenuExpanded(true)}>
                    <DropdownMenuItem.Text>
                      <ComposeText>Submenu</ComposeText>
                    </DropdownMenuItem.Text>
                    <DropdownMenuItem.LeadingIcon>
                      <Icon source={printIcon} size={24} />
                    </DropdownMenuItem.LeadingIcon>
                  </DropdownMenuItem>
                </DropdownMenu.Trigger>
                <DropdownMenu.Items>
                  <DropdownMenuItem
                    onClick={() => {
                      setSectionsMenuExpanded(false);
                      console.log('Profile pressed');
                    }}>
                    <DropdownMenuItem.Text>
                      <ComposeText>Profile Settings</ComposeText>
                    </DropdownMenuItem.Text>
                    <DropdownMenuItem.LeadingIcon>
                      <Icon source={profileIcon} size={24} />
                    </DropdownMenuItem.LeadingIcon>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSectionsMenuExpanded(false);
                      console.log('Notifications pressed');
                    }}>
                    <DropdownMenuItem.Text>
                      <ComposeText>Notifications</ComposeText>
                    </DropdownMenuItem.Text>
                    <DropdownMenuItem.LeadingIcon>
                      <Icon source={notificationIcon} size={24} />
                    </DropdownMenuItem.LeadingIcon>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSwitchChecked(!switchChecked)}>
                    <DropdownMenuItem.Text>
                      <ComposeText>
                        {switchChecked ? 'Dark Mode: ON' : 'Dark Mode: OFF'}
                      </ComposeText>
                    </DropdownMenuItem.Text>
                    <DropdownMenuItem.LeadingIcon>
                      <Icon source={darkModeIcon} size={24} />
                    </DropdownMenuItem.LeadingIcon>
                  </DropdownMenuItem>
                </DropdownMenu.Items>
              </DropdownMenu>
              <HorizontalDivider />
              <DropdownMenuItem
                onClick={() => {
                  setSectionsMenuExpanded(false);
                  console.log('Logout pressed');
                }}>
                <DropdownMenuItem.Text>
                  <ComposeText>Logout</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={logoutIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
            </DropdownMenu.Items>
          </DropdownMenu>
        </Host>
      </Section>
    </View>
  );
}

DropdownMenuScreen.navigationOptions = {
  title: 'Dropdown Menu',
};
