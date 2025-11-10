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
} from '@expo/ui/swift-ui';
import { buttonStyle } from '@expo/ui/swift-ui/modifiers';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';

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

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Context Menu with glass effect button">
          <ContextMenu modifiers={[buttonStyle('glass')]}>
            <ContextMenu.Items>
              <Button
                systemImage="person.crop.circle.badge.xmark"
                onPress={() => console.log('Pressed1')}>
                Hello
              </Button>
              <Button
                variant="bordered"
                systemImage="heart"
                onPress={() => console.log('Pressed2')}>
                I love
              </Button>
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
                systemImage="person.crop.circle.badge.xmark"
                onPress={() => console.log('Pressed1')}>
                Hello
              </Button>
              <Button
                variant="bordered"
                systemImage="heart"
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
              <Button role="destructive" systemImage="hand.thumbsdown">
                I don't like doggos 😡
              </Button>
              <ContextMenu>
                <ContextMenu.Items>
                  <Button>I hate</Button>
                  <Button>doggos</Button>
                  <ContextMenu>
                    <ContextMenu.Items>
                      <Button>I KILL</Button>
                      <Button>DOGGOS</Button>
                    </ContextMenu.Items>
                    <ContextMenu.Trigger>
                      <Button>👹Very evil submenu 👺</Button>
                    </ContextMenu.Trigger>
                  </ContextMenu>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <Button systemImage="heart.slash">Evil submenu</Button>
                </ContextMenu.Trigger>
              </ContextMenu>
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <View style={styles.longPressMenu}>
                <VideoView player={player} style={styles.longPressMenu} contentFit="cover" />
              </View>
            </ContextMenu.Trigger>
            <ContextMenu.Preview>
              <View style={styles.preview}>
                <RNText>This is a preview</RNText>
              </View>
            </ContextMenu.Preview>
          </ContextMenu>
        </Section>
        <Section title="SwiftUI Section and Divider Components">
          <ContextMenu modifiers={[buttonStyle('glass')]}>
            <ContextMenu.Items>
              <Button role="destructive">Delete</Button>
              <Divider />
              <Button onPress={() => console.log('Pressed3')}>Add to favorites</Button>
              <SwiftUISection title="Primary actions">
                <Button onPress={() => console.log('Pressed1')}>First</Button>
                <Button onPress={() => console.log('Pressed2')}>Second</Button>
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
              <Button role="destructive">
                <Image systemName="trash" />
                <Text>Red color item</Text>
                <Text>Subtitle</Text>
              </Button>
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
