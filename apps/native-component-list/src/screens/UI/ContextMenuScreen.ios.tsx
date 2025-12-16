import {
  Button,
  Host,
  Switch,
  ContextMenu,
  List,
  Section,
  Divider,
  RNHostView,
  Section as SwiftUISection,
  Text,
  Image,
  Picker,
  Menu,
} from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';

const videoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function ContextMenuScreen() {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [selectedPriority, setSelectedPriority] = React.useState<string | number>('medium');

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Basic">
          <ContextMenu>
            <ContextMenu.Items>
              <Button label="Copy" systemImage="doc.on.doc" onPress={() => console.log('Copy')} />
              <Button label="Share" systemImage="square.and.arrow.up" />
              <Button label="Delete" systemImage="trash" role="destructive" />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>Long press me</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>

        <Section title="With Switches">
          <ContextMenu>
            <ContextMenu.Items>
              <Switch
                label="Favorite"
                systemImage="star"
                value={isFavorite}
                onValueChange={setIsFavorite}
              />
              <Switch
                label="Notifications"
                systemImage="bell"
                variant="switch"
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>Settings Menu</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>

        <Section title="With Picker">
          <ContextMenu>
            <ContextMenu.Items>
              <Picker
                label="Priority"
                modifiers={[pickerStyle('menu')]}
                selection={selectedPriority}
                onSelectionChange={setSelectedPriority}>
                <Text modifiers={[tag('low')]}>Low</Text>
                <Text modifiers={[tag('medium')]}>Medium</Text>
                <Text modifiers={[tag('high')]}>High</Text>
              </Picker>
              <Divider />
              <Button label="Save" systemImage="checkmark" />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>Priority: {selectedPriority}</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>

        <Section title="With Sections">
          <ContextMenu>
            <ContextMenu.Items>
              <SwiftUISection title="Edit">
                <Button label="Cut" systemImage="scissors" />
                <Button label="Copy" systemImage="doc.on.doc" />
                <Button label="Paste" systemImage="doc.on.clipboard" />
              </SwiftUISection>
              <SwiftUISection title="Actions">
                <Button label="Share" systemImage="square.and.arrow.up" />
                <Button label="Duplicate" systemImage="plus.square.on.square" />
              </SwiftUISection>
              <Button label="Delete" systemImage="trash" role="destructive" />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>Grouped Actions</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>

        <Section title="With Submenu">
          <ContextMenu>
            <ContextMenu.Items>
              <Button label="Open" systemImage="doc" />
              <Menu label="Share" systemImage="square.and.arrow.up">
                <Button label="Messages" systemImage="message" />
                <Button label="Mail" systemImage="envelope" />
                <Button label="AirDrop" systemImage="airplayaudio" />
                <Menu label="Social" systemImage="person.2">
                  <Button label="Twitter" />
                  <Button label="Facebook" />
                  <Button label="Instagram" />
                </Menu>
              </Menu>
              <Divider />
              <Button label="Delete" systemImage="trash" role="destructive" />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>File Options</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>

        <Section title="Button with Subtitle">
          <ContextMenu>
            <ContextMenu.Items>
              <Button>
                <Image systemName="person.crop.circle" />
                <Text>John Doe</Text>
                <Text>View Profile</Text>
              </Button>
              <Button>
                <Image systemName="envelope" />
                <Text>Send Message</Text>
                <Text>Start a conversation</Text>
              </Button>
              <Button role="destructive">
                <Image systemName="person.badge.minus" />
                <Text>Remove Friend</Text>
                <Text>This cannot be undone</Text>
              </Button>
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>User Actions</Text>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>

        <Section title="React Native Trigger">
          <ContextMenu>
            <ContextMenu.Items>
              <Button label="Play" systemImage="play.fill" />
              <Button label="Add to Playlist" systemImage="plus" />
              <Divider />
              <Button label="Share" systemImage="square.and.arrow.up" />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <RNHostView matchContents>
                <View style={styles.videoContainer}>
                  <VideoView player={player} style={styles.video} contentFit="cover" />
                </View>
              </RNHostView>
            </ContextMenu.Trigger>
          </ContextMenu>
        </Section>

        <Section title="React Native Preview">
          <ContextMenu>
            <ContextMenu.Items>
              <Button label="Play" systemImage="play.fill" />
              <Button label="Share" systemImage="square.and.arrow.up" />
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <Text>Video with Preview</Text>
            </ContextMenu.Trigger>
            <ContextMenu.Preview>
              <RNHostView matchContents>
                <View style={styles.preview}>
                  <VideoView player={player} style={styles.previewVideo} contentFit="cover" />
                  <View style={styles.previewOverlay}>
                    <RNText style={styles.previewTitle}>Big Buck Bunny</RNText>
                    <RNText style={styles.previewSubtitle}>Video Preview</RNText>
                  </View>
                </View>
              </RNHostView>
            </ContextMenu.Preview>
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
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  preview: {
    width: 280,
    height: 180,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
});
