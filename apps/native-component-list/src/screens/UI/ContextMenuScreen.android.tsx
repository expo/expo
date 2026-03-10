import {
  Button,
  ContextMenu,
  Divider,
  DropdownMenuItem,
  Host,
  Icon,
  Row,
  Switch,
  Text as ComposeText,
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
const darkModeIcon = require('../../../assets/icons/api/ScreenOrientation.png');
const logoutIcon = require('../../../assets/icons/api/SecureStore.png');
const settingsIcon = require('../../../assets/icons/api/Sensor.png');
const starIcon = require('../../../assets/icons/api/StoreReview.png');

export default function ContextMenuScreen() {
  const [switchChecked, setSwitchChecked] = React.useState<boolean>(true);
  const [switch2Checked, setSwitch2Checked] = React.useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = React.useState<'Light' | 'Dark' | 'Auto'>('Auto');

  const themeBackgroundColor = selectedTheme === 'Dark' ? 'black' : 'white';

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Section title="Theme Context Menu">
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Theme</Text>
          <Host matchContents>
            <ContextMenu color={themeBackgroundColor}>
              <ContextMenu.Trigger>
                <Button
                  elementColors={{ containerColor: 'transparent', contentColor: 'blue' }}
                  trailingIcon="filled.ArrowDropDown">
                  {selectedTheme}
                </Button>
              </ContextMenu.Trigger>
              <ContextMenu.Items>
                <DropdownMenuItem onClick={() => setSelectedTheme('Light')}>
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
                <DropdownMenuItem onClick={() => setSelectedTheme('Dark')}>
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
                <DropdownMenuItem onClick={() => setSelectedTheme('Auto')}>
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
              </ContextMenu.Items>
            </ContextMenu>
          </Host>
        </View>
      </Section>
      <Section title="Colorful Context Menu">
        <Host matchContents>
          <ContextMenu color="#e3b7ff">
            <ContextMenu.Trigger>
              <Button variant="bordered">Show Colorful Menu</Button>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              <DropdownMenuItem
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
              <DropdownMenuItem>
                <DropdownMenuItem.Text>
                  <Row verticalAlignment="center">
                    <ComposeText>I'm very colorful!</ComposeText>
                    <Switch
                      value={switchChecked}
                      variant="checkbox"
                      elementColors={{
                        checkedColor: '#ff0000',
                        disabledCheckedColor: '#00ff00',
                        uncheckedColor: '#0000ff',
                        checkmarkColor: '#ffff00',
                      }}
                      onValueChange={setSwitchChecked}
                    />
                  </Row>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DropdownMenuItem.Text>
                  <Row verticalAlignment="center">
                    <ComposeText>Switches can be colorful too!</ComposeText>
                    <Switch
                      value={switch2Checked}
                      variant="switch"
                      onValueChange={setSwitch2Checked}
                      elementColors={{
                        checkedThumbColor: '#ff0000',
                        checkedTrackColor: '#00ff00',
                        uncheckedThumbColor: '#0000ff',
                        uncheckedTrackColor: '#ffff00',
                      }}
                    />
                  </Row>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            </ContextMenu.Items>
          </ContextMenu>
        </Host>
      </Section>
      <Section title="Context Menu with Sections">
        <Host matchContents>
          <ContextMenu>
            <ContextMenu.Trigger>
              <Button variant="outlined">Show Menu with Sections</Button>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              <DropdownMenuItem onClick={() => console.log('Home pressed')}>
                <DropdownMenuItem.Text>
                  <ComposeText>Home</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={homeIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <Divider />
              <DropdownMenuItem onClick={() => console.log('Profile pressed')}>
                <DropdownMenuItem.Text>
                  <ComposeText>Profile Settings</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={profileIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Notifications pressed')}>
                <DropdownMenuItem.Text>
                  <ComposeText>Notifications</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={notificationIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSwitchChecked(!switchChecked)}>
                <DropdownMenuItem.Text>
                  <ComposeText>{switchChecked ? 'Dark Mode: ON' : 'Dark Mode: OFF'}</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={darkModeIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <Divider />
              <DropdownMenuItem onClick={() => console.log('Logout pressed')}>
                <DropdownMenuItem.Text>
                  <ComposeText>Logout</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={logoutIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <Divider />
              <ContextMenu>
                <ContextMenu.Trigger>
                  <DropdownMenuItem>
                    <DropdownMenuItem.Text>
                      <ComposeText>Submenu</ComposeText>
                    </DropdownMenuItem.Text>
                    <DropdownMenuItem.LeadingIcon>
                      <Icon source={logoutIcon} size={24} />
                    </DropdownMenuItem.LeadingIcon>
                  </DropdownMenuItem>
                </ContextMenu.Trigger>
                <ContextMenu.Items>
                  <DropdownMenuItem onClick={() => console.log('Logout pressed')}>
                    <DropdownMenuItem.Text>
                      <ComposeText>Logout</ComposeText>
                    </DropdownMenuItem.Text>
                    <DropdownMenuItem.LeadingIcon>
                      <Icon source={logoutIcon} size={24} />
                    </DropdownMenuItem.LeadingIcon>
                  </DropdownMenuItem>
                </ContextMenu.Items>
              </ContextMenu>
            </ContextMenu.Items>
          </ContextMenu>
        </Host>
      </Section>
    </View>
  );
}

ContextMenuScreen.navigationOptions = {
  title: 'Context Menu',
};
