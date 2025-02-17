import { Button } from '@expo/ui/components/Button';
import { ContextMenu, Submenu } from '@expo/ui/components/ContextMenu';
import { Picker } from '@expo/ui/components/Picker';
import { Switch } from '@expo/ui/components/Switch';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

import { Section } from '../../components/Page';

const videoLink =
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4';

export default function ContextMenuScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(1);
  const [switchChecked, setSwitchChecked] = React.useState<boolean>(true);
  const [switch2Checked, setSwitch2Checked] = React.useState<boolean>(true);

  const player = useVideoPlayer(videoLink, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  const MenuItems = (
    <>
      <Button systemImage="person.crop.circle.badge.xmark" onPress={() => console.log('Pressed1')}>
        Hello
      </Button>
      <Button variant="bordered" systemImage="heart" onPress={() => console.log('Pressed2')}>
        I love
      </Button>
      <Picker
        label="Doggos"
        options={['very', 'veery', 'veeery', 'much']}
        variant="menu"
        selectedIndex={selectedIndex}
        onOptionSelected={({ nativeEvent: { index } }) => setSelectedIndex(index)}
      />
      <Switch
        value={switchChecked}
        label="Do u love doggos?"
        variant="checkbox"
        onValueChange={setSwitchChecked}
      />
      <Switch
        value={switch2Checked}
        variant="switch"
        label="Will u marry doggos?"
        onValueChange={setSwitch2Checked}
      />
      <Button role="destructive" systemImage="hand.thumbsdown">
        I don't like doggos 😡
      </Button>
      <Submenu button={<Button systemImage="heart.slash">Evil submenu</Button>}>
        <Button>I hate</Button>
        <Button>doggos</Button>
        <Submenu button={<Button>👹Very evil submenu 👺</Button>}>
          <Button>I KILL</Button>
          <Button>DOGGOS</Button>
        </Submenu>
      </Submenu>
    </>
  );

  return (
    <View>
      <Section title="Single-Press Context Menu" row>
        <ContextMenu Items={MenuItems} style={{ width: 150, height: 50 }}>
          <Button variant="bordered" style={{ width: 150, height: 50 }}>
            Show Menu
          </Button>
        </ContextMenu>
      </Section>
      <Section title="Long-Press Context Menu" row>
        <ContextMenu activationMethod="longPress" style={styles.longPressMenu} Items={MenuItems}>
          <View style={styles.longPressMenu}>
            <VideoView player={player} style={styles.longPressMenu} contentFit="cover" />
          </View>
        </ContextMenu>
      </Section>
      {Platform.OS === 'android' && (
        <Section title="Colorful Context Menu">
          <ContextMenu
            color="#e3b7ff"
            Items={
              <>
                <Button variant="bordered" color="#ff0000">
                  I'm red!
                </Button>
                <Button
                  variant="bordered"
                  elementColors={{ containerColor: '#0000ff', contentColor: '#00ff00' }}>
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
              </>
            }>
            <Button variant="bordered" style={{ width: 200, height: 50 }}>
              Show Colorful Menu
            </Button>
          </ContextMenu>
        </Section>
      )}
    </View>
  );
}

ContextMenuScreen.navigationOptions = {
  title: 'Context Menu',
};

const styles = StyleSheet.create({
  menuIcon: {
    width: 32,
    height: 32,
  },
  longPressMenu: {
    width: 200,
    height: 200,
  },
});
