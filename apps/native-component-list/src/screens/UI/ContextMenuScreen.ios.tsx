import {
  Button,
  Host,
  Picker,
  Switch,
  ContextMenu,
  Text,
  Section as SwiftUISection,
  Image,
  List,
  Section,
  Divider,
  RNHostView,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  menuActionDismissBehavior,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';

const videoLink =
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4';

export default function ContextMenuScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number | undefined>(1);
  const [switchChecked, setSwitchChecked] = React.useState<boolean>(true);
  const [switch2Checked, setSwitch2Checked] = React.useState<boolean>(true);

  const player = useVideoPlayer(videoLink, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Context Menu with glass effect button">
          <ContextMenu modifiers={[buttonStyle('glass')]}>
            <ContextMenu.Items>
              <Button
                label="Hello"
                systemImage="person.crop.circle.badge.xmark"
                onPress={() => console.log('Pressed1')}
              />
              <Button
                label="I love"
                systemImage="heart"
                modifiers={[buttonStyle('bordered')]}
                onPress={() => console.log('Pressed2')}
              />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text color="accentColor">Show menu</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>
        <Section title="Single-Press Context Menu">
          <ContextMenu modifiers={[buttonStyle('bordered')]}>
            <ContextMenu.Items>
              <Button
                label="Hello"
                systemImage="person.crop.circle.badge.xmark"
                onPress={() => console.log('Pressed1')}
              />
              <Button
                label="I love"
                systemImage="heart"
                modifiers={[buttonStyle('bordered')]}
                onPress={() => console.log('Pressed2')}
              />
              <Picker
                label="Doggos"
                modifiers={[pickerStyle('menu')]}
                selection={selectedIndex}
                onSelectionChange={({ nativeEvent: { selection } }) =>
                  setSelectedIndex(selection as number)
                }>
                {['very', 'veery', 'veeery', 'much'].map((option, index) => (
                  <Text key={index} modifiers={[tag(index)]}>
                    {option}
                  </Text>
                ))}
              </Picker>
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text color="accentColor">Show Menu</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>
        <Section title="Long-Press Context Menu">
          <ContextMenu activationMethod="longPress">
            <ContextMenu.Items>
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
                systemImage="heart.slash"
                onValueChange={setSwitch2Checked}
              />
              <Button
                role="destructive"
                systemImage="hand.thumbsdown"
                label="I don't like doggos 😡"
              />
              <ContextMenu>
                <ContextMenu.Items>
                  <Button label="I hate" />
                  <Button label="doggos" />
                  <ContextMenu>
                    <ContextMenu.Items>
                      <Button label="I KILL" />
                      <Button label="DOGGOS" />
                    </ContextMenu.Items>
                    <ContextMenu.Trigger>
                      <Button label="👹Very evil submenu 👺" />
                    </ContextMenu.Trigger>
                  </ContextMenu>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <Button systemImage="heart.slash" label="Evil submenu" />
                </ContextMenu.Trigger>
              </ContextMenu>
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <RNHostView matchContents>
                <View style={styles.longPressMenu}>
                  <VideoView player={player} style={styles.longPressMenu} contentFit="cover" />
                </View>
              </RNHostView>
            </ContextMenu.Trigger>
            <ContextMenu.Preview>
              <View style={styles.preview}>
                <RNText>This is a preview</RNText>
              </View>
            </ContextMenu.Preview>
          </ContextMenu>
        </Section>
        <Section title="Context Menu Dismissal Behavior">
          <ContextMenu modifiers={[menuActionDismissBehavior('disabled')]}>
            <ContextMenu.Items>
              <Button onPress={() => console.log('Pressed3')} label="Do not dismiss" />
              <Button
                label="Automatically dismiss"
                onPress={() => console.log('Pressed1')}
                modifiers={[menuActionDismissBehavior('automatic')]}
              />
              <Button
                label="Always dismiss"
                onPress={() => console.log('Pressed2')}
                modifiers={[menuActionDismissBehavior('enabled')]}
              />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text color="accentColor">Show menu</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>
        <Section title="SwiftUI Section and Divider Components">
          <ContextMenu modifiers={[buttonStyle('glass')]}>
            <ContextMenu.Items>
              <Button role="destructive" label="Delete" />
              <Divider />
              <Button onPress={() => console.log('Pressed3')} label="Add to favorites" />
              <SwiftUISection title="Primary actions">
                <Button onPress={() => console.log('Pressed1')} label="First" />
                <Button onPress={() => console.log('Pressed2')} label="Second" />
              </SwiftUISection>
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text color="accentColor">Show menu</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>
        <Section title="Menu item with title and subtitle">
          <ContextMenu modifiers={[buttonStyle('glass')]}>
            <ContextMenu.Items>
              <Button
                role="destructive"
                label={
                  <>
                    <Image systemName="trash" />
                    <Text>Red color item</Text>
                    <Text>Subtitle</Text>
                  </>
                }
              />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>Show Menu</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>
      </List>
    </Host>
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
  preview: {
    width: 300,
    height: 200,
    padding: 20,
    backgroundColor: '#ffeeee',
  },
});
