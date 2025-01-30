import { Button } from '@expo/ui/components/Button';
import { ContextMenu, Submenu } from '@expo/ui/components/ContextMenu';
import { Picker } from '@expo/ui/components/Picker';
import { Switch } from '@expo/ui/components/Switch';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, Platform, StyleSheet } from 'react-native';

import { Section } from '../../components/Page';

const videoLink =
  Platform.OS === 'ios'
    ? 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4'
    : null;

export default function ContextMenuScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(1);
  const [switchChecked, setSwitchChecked] = React.useState<boolean>(true);
  const [switch2Checked, setSwitch2Checked] = React.useState<boolean>(true);

  const [contextMenuExpanded, setContextMenuExpanded] = React.useState<boolean>(false);

  const player = useVideoPlayer(videoLink, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  const MenuItems = (
    <>
      <Button
        text="Hello"
        systemImage="person.crop.circle.badge.xmark"
        onPress={() => console.log('Pressed1')}
      />
      <Button
        text="I love"
        variant="bordered"
        systemImage="heart"
        onPress={() => console.log('Pressed2')}
      />
      <Picker
        label="Doggos"
        options={['very', 'veery', 'veeery', 'much']}
        variant="menu"
        selectedIndex={selectedIndex}
        onOptionSelected={({ nativeEvent: { index } }) => setSelectedIndex(index)}
      />
      <Switch
        checked={switchChecked}
        label="Do u love doggos?"
        variant="checkbox"
        onCheckedChanged={({ nativeEvent: { checked } }) => setSwitchChecked(checked)}
      />
      <Switch
        checked={switch2Checked}
        variant="switch"
        label="Will u marry doggos?"
        onCheckedChanged={({ nativeEvent: { checked } }) => setSwitch2Checked(checked)}
      />
      <Button text="I don't like doggos 😡" role="destructive" systemImage="hand.thumbsdown" />
      <Submenu button={<Button systemImage="heart.slash" text="Evil submenu" />}>
        <Button text="I hate" />
        <Button text="doggos" />
        <Submenu button={<Button text="👹Very evil submenu 👺" />}>
          <Button text="I KILL" />
          <Button text="DOGGOS" />
        </Submenu>
      </Submenu>
    </>
  );

  return (
    <View>
      <Section title="Single-Press Context Menu" row>
        <ContextMenu
          expanded={contextMenuExpanded}
          onExpandedChanged={(e) => setContextMenuExpanded(e.nativeEvent.expanded)}
          Items={MenuItems}
          style={{ width: 150, height: 50 }}>
          <Button
            text="Show Menu"
            onPress={() => setContextMenuExpanded(true)}
            variant="bordered"
            style={{ width: 150, height: 50 }}
          />
        </ContextMenu>
      </Section>
      {Platform.OS === 'ios' && (
        <Section title="Long-Press Context Menu" row>
          <ContextMenu
            activationMethod="longPress"
            expanded={contextMenuExpanded}
            onExpandedChanged={(e) => setContextMenuExpanded(e.nativeEvent.expanded)}
            style={styles.longPressMenu}
            Items={MenuItems}>
            <View style={styles.longPressMenu}>
              <VideoView player={player} style={styles.longPressMenu} contentFit="cover" />
            </View>
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
