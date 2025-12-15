import { Button, Switch, ContextMenu, Submenu } from '@expo/ui/jetpack-compose';
// import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, /* StyleSheet, */ Text } from 'react-native';

import { Section } from '../../components/Page';

// const videoLink =
//   'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4';

export default function ContextMenuScreen() {
  // const [selectedIndex, setSelectedIndex] = React.useState<number | null>(1);
  const [switchChecked, setSwitchChecked] = React.useState<boolean>(true);
  const [switch2Checked, setSwitch2Checked] = React.useState<boolean>(true);
  const [selectedTheme, setSelectedTheme] = React.useState<'Light' | 'Dark' | 'Auto'>('Auto');

  const themeForegroundColor = selectedTheme === 'Dark' ? 'white' : 'black';
  const themeBackgroundColor = selectedTheme === 'Dark' ? 'black' : 'white';
  // const player = useVideoPlayer(videoLink, (player) => {
  //   player.loop = true;
  //   player.muted = true;
  //   player.play();
  // });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Section title="Theme Context Menu">
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Theme</Text>
          <ContextMenu color={themeBackgroundColor}>
            <ContextMenu.Trigger>
              <Button
                elementColors={{ containerColor: 'transparent', contentColor: 'blue' }}
                trailingIcon="filled.ArrowDropDown">
                {selectedTheme}
              </Button>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              <Button
                elementColors={{
                  containerColor: 'transparent',
                  contentColor: themeForegroundColor,
                }}
                onPress={() => setSelectedTheme('Light')}
                leadingIcon="filled.Star"
                trailingIcon={selectedTheme === 'Light' ? 'filled.Check' : undefined}>
                Light
              </Button>
              <Button
                elementColors={{
                  containerColor: 'transparent',
                  contentColor: themeForegroundColor,
                }}
                onPress={() => setSelectedTheme('Dark')}
                leadingIcon="filled.Face"
                trailingIcon={selectedTheme === 'Dark' ? 'filled.Check' : undefined}>
                Dark
              </Button>
              <Button
                elementColors={{
                  containerColor: 'transparent',
                  contentColor: themeForegroundColor,
                }}
                onPress={() => setSelectedTheme('Auto')}
                leadingIcon="filled.Settings"
                trailingIcon={selectedTheme === 'Auto' ? 'filled.Check' : undefined}>
                Auto
              </Button>
            </ContextMenu.Items>
          </ContextMenu>
        </View>
      </Section>
      <Section title="Colorful Context Menu">
        <ContextMenu color="#e3b7ff">
          <ContextMenu.Trigger>
            <Button variant="bordered">Show Colorful Menu</Button>
          </ContextMenu.Trigger>
          <ContextMenu.Items>
            <Button variant="bordered" color="#ff0000" leadingIcon="filled.Favorite">
              I'm red!
            </Button>
            <Button
              variant="bordered"
              elementColors={{ containerColor: '#0000ff', contentColor: '#00ff00' }}
              leadingIcon="filled.Star"
              trailingIcon="filled.Check">
              My text is green!
            </Button>
            <Switch
              value={switchChecked}
              label="I'm very colorful!"
              variant="checkbox"
              elementColors={{
                checkedColor: '#ff0000',
                disabledCheckedColor: '#00ff00',
                uncheckedColor: '#0000ff',
                checkmarkColor: '#ffff00',
              }}
              onValueChange={setSwitchChecked}
            />
            <Switch
              value={switch2Checked}
              variant="switch"
              label="Switches can be colorul too!"
              onValueChange={setSwitch2Checked}
              elementColors={{
                checkedThumbColor: '#ff0000',
                checkedTrackColor: '#00ff00',
                uncheckedThumbColor: '#0000ff',
                uncheckedTrackColor: '#ffff00',
              }}
            />
          </ContextMenu.Items>
        </ContextMenu>
      </Section>
      <Section title="Context Menu with Submenu">
        <ContextMenu>
          <ContextMenu.Trigger>
            <Button variant="outlined">Show Menu with Submenu</Button>
          </ContextMenu.Trigger>
          <ContextMenu.Items>
            <Button leadingIcon="filled.Home" onPress={() => console.log('Home pressed')}>
              Home
            </Button>
            <Submenu
              button={
                <Button leadingIcon="filled.Settings" trailingIcon="filled.ArrowForward">
                  Settings
                </Button>
              }>
              <Button leadingIcon="filled.Person" onPress={() => console.log('Profile pressed')}>
                Profile Settings
              </Button>
              <Button
                leadingIcon="filled.Notifications"
                onPress={() => console.log('Notifications pressed')}>
                Notifications
              </Button>
              <Switch
                value={switchChecked}
                label="Enable Dark Mode"
                variant="switch"
                onValueChange={setSwitchChecked}
              />
            </Submenu>
            <Button leadingIcon="filled.ExitToApp" onPress={() => console.log('Logout pressed')}>
              Logout
            </Button>
          </ContextMenu.Items>
        </ContextMenu>
      </Section>
    </View>
  );
}

ContextMenuScreen.navigationOptions = {
  title: 'Context Menu',
};

// const styles = StyleSheet.create({
//   menuIcon: {
//     width: 32,
//     height: 32,
//   },
//   longPressMenu: {
//     width: 200,
//     height: 200,
//   },
//   preview: {
//     width: 300,
//     height: 200,
//     padding: 20,
//     backgroundColor: '#ffeeee',
//   },
// });
