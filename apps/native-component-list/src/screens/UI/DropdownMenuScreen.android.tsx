import {
  Button,
  Checkbox,
  DropdownMenu,
  HorizontalDivider,
  DropdownMenuItem,
  Host,
  Icon,
  RNHostView,
  Row,
  Switch,
  Text as ComposeText,
  FilledTonalButton,
  OutlinedButton,
} from '@expo/ui/jetpack-compose';
import { background, combinedClickable, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { View, Text, Alert, Pressable } from 'react-native';

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
  const [longPressMenuExpanded, setLongPressMenuExpanded] = React.useState(false);
  const [longPressTapCount, setLongPressTapCount] = React.useState(0);
  const [rnTriggerMenuExpanded, setRnTriggerMenuExpanded] = React.useState(false);
  const [rnTriggerTapCount, setRnTriggerTapCount] = React.useState(0);

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
                  elementColors={{
                    leadingIconColor: '#ff0000',
                    textColor: '#00ff00',
                    trailingIconColor: '#0000ff',
                  }}
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
                <DropdownMenuItem
                  enabled={false}
                  elementColors={{
                    leadingIconColor: '#ff0000',
                    textColor: '#00ff00',
                    trailingIconColor: '#0000ff',
                    disabledLeadingIconColor: '#808080',
                    disabledTextColor: '#808080',
                    disabledTrailingIconColor: '#808080',
                  }}
                  onClick={() => {
                    Alert.alert('This should not happen');
                  }}>
                  <DropdownMenuItem.Text>
                    <ComposeText>Disabled</ComposeText>
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
                  <Icon tint="#ff0000" source={starIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
                <DropdownMenuItem.TrailingIcon>
                  <Icon tint="#0000ff" source={checkIcon} size={24} />
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
                elementColors={{ textColor: '#B3261E', leadingIconColor: '#B3261E' }}
                onClick={() => {
                  setSectionsMenuExpanded(false);
                  console.log('Delete account pressed');
                }}>
                <DropdownMenuItem.Text>
                  <ComposeText>Delete account</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={logoutIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
            </DropdownMenu.Items>
          </DropdownMenu>
        </Host>
      </Section>
      <Section title="Long-press to open">
        <Host matchContents>
          <DropdownMenu
            expanded={longPressMenuExpanded}
            onDismissRequest={() => setLongPressMenuExpanded(false)}>
            <DropdownMenu.Trigger>
              <ComposeText
                modifiers={[
                  background('#e0e0e0'),
                  paddingAll(12),
                  combinedClickable({
                    onClick: () => setLongPressTapCount((count) => count + 1),
                    onLongClick: () => setLongPressMenuExpanded(true),
                  }),
                ]}>
                {`Long-press to open · taps: ${longPressTapCount}`}
              </ComposeText>
            </DropdownMenu.Trigger>
            <DropdownMenu.Items>
              <DropdownMenuItem onClick={() => setLongPressMenuExpanded(false)}>
                <DropdownMenuItem.Text>
                  <ComposeText>Copy</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={profileIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLongPressMenuExpanded(false)}>
                <DropdownMenuItem.Text>
                  <ComposeText>Share</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={starIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
              <DropdownMenuItem
                elementColors={{ textColor: '#B3261E', leadingIconColor: '#B3261E' }}
                onClick={() => setLongPressMenuExpanded(false)}>
                <DropdownMenuItem.Text>
                  <ComposeText>Delete</ComposeText>
                </DropdownMenuItem.Text>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={logoutIcon} size={24} />
                </DropdownMenuItem.LeadingIcon>
              </DropdownMenuItem>
            </DropdownMenu.Items>
          </DropdownMenu>
        </Host>
      </Section>
      <Section title="RN trigger long-press (spike)">
        <Host matchContents>
          <DropdownMenu
            expanded={rnTriggerMenuExpanded}
            onDismissRequest={() => setRnTriggerMenuExpanded(false)}>
            <DropdownMenu.Trigger>
              <RNHostView matchContents>
                <Pressable
                  onPress={() => setRnTriggerTapCount((c) => c + 1)}
                  onLongPress={() => setRnTriggerMenuExpanded(true)}
                  style={{ padding: 16, backgroundColor: '#ffe0b2', borderRadius: 8 }}>
                  <Text style={{ fontSize: 16 }}>
                    {`RN child trigger · taps: ${rnTriggerTapCount}`}
                  </Text>
                </Pressable>
              </RNHostView>
            </DropdownMenu.Trigger>
            <DropdownMenu.Items>
              <DropdownMenuItem onClick={() => setRnTriggerMenuExpanded(false)}>
                <DropdownMenuItem.Text>
                  <ComposeText>Item from RN-anchored menu</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                elementColors={{ textColor: '#B3261E' }}
                onClick={() => setRnTriggerMenuExpanded(false)}>
                <DropdownMenuItem.Text>
                  <ComposeText>Destructive item</ComposeText>
                </DropdownMenuItem.Text>
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
