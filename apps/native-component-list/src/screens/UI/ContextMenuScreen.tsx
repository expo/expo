import { Button } from '@expo/ui/components/Button';
import { ContextMenu, Submenu } from '@expo/ui/components/ContextMenu';
import { Picker } from '@expo/ui/components/Picker';
import { Switch } from '@expo/ui/components/Switch';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, StyleSheet } from 'react-native';

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
      <Button
        systemImage={{ ios: 'person.crop.circle.badge.xmark' }}
        onPress={() => console.log('Pressed1')}>
        Hello
      </Button>
      <Button
        variant="bordered"
        systemImage={{ ios: 'heart' }}
        onPress={() => console.log('Pressed2')}>
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
      <Button role="destructive" systemImage={{ ios: 'hand.thumbsdown' }}>
        I don't like doggos 😡
      </Button>
      <Submenu button={<Button systemImage={{ ios: 'heart.slash' }}>Evil submenu</Button>}>
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
