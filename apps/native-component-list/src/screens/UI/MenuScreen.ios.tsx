import {
  Button,
  ControlGroup,
  Host,
  Image,
  Menu,
  Text,
  List,
  Section,
  Divider,
  Picker,
  RNHostView,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  foregroundStyle,
  labelStyle,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { Pressable, Text as RNText } from 'react-native';

export default function MenuScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number | undefined>(1);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Simple text label">
          <Menu label="Options">
            <Button onPress={() => console.log('Option 1')} label="Option 1" />
            <Button onPress={() => console.log('Option 2')} label="Option 2" />
            <Button onPress={() => console.log('Option 3')} label="Option 3" />
          </Menu>
        </Section>

        <Section title="Text label with SF Symbol">
          <Menu label="More" systemImage="ellipsis.circle">
            <Button systemImage="gear" onPress={() => console.log('Settings')} label="Settings" />
            <Button systemImage="person" onPress={() => console.log('Profile')} label="Profile" />
            <Divider />
            <Button
              role="destructive"
              systemImage="trash"
              onPress={() => console.log('Delete')}
              label="Delete"
            />
          </Menu>
        </Section>

        <Section title="Custom label">
          <Menu label={<Text modifiers={[foregroundStyle('accentColor')]}>Custom Label</Text>}>
            <Button onPress={() => console.log('Action 1')} label="Action 1" />
            <Button onPress={() => console.log('Action 2')} label="Action 2" />
          </Menu>
        </Section>

        <Section title="RN Pressable label">
          <Menu
            label={
              <RNHostView matchContents>
                <Pressable
                  onPress={() => console.log('RN trigger pressed')}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                    backgroundColor: '#9B59B6',
                  }}>
                  <RNText style={{ color: 'white', fontWeight: '600' }}>
                    RN Pressable Trigger
                  </RNText>
                </Pressable>
              </RNHostView>
            }>
            <Button onPress={() => console.log('Item 1')} label="Item 1" />
            <Button onPress={() => console.log('Item 2')} label="Item 2" />
          </Menu>
        </Section>

        <Section title="Menu with Picker">
          <Menu label="Select Option" systemImage="list.bullet">
            <Picker
              label="Choose"
              modifiers={[pickerStyle('menu')]}
              selection={selectedIndex}
              onSelectionChange={setSelectedIndex}>
              {['First', 'Second', 'Third', 'Fourth'].map((option, index) => (
                <Text key={index} modifiers={[tag(index)]}>
                  {option}
                </Text>
              ))}
            </Picker>
            <Divider />
            <Button onPress={() => console.log('Confirm')} label="Confirm Selection" />
          </Menu>
        </Section>

        <Section title="Nested Menu">
          <Menu label="Main Menu">
            <Button onPress={() => console.log('Item 1')} label="Item 1" />
            <Menu label="Submenu">
              <Button onPress={() => console.log('Sub Item 1')} label="Sub Item 1" />
              <Button onPress={() => console.log('Sub Item 2')} label="Sub Item 2" />
            </Menu>
            <Button onPress={() => console.log('Item 2')} label="Item 2" />
          </Menu>
        </Section>

        <Section title="Menu with modifiers">
          <Menu label="Styled Menu" modifiers={[buttonStyle('borderedProminent')]}>
            <Button onPress={() => console.log('Styled 1')} label="Styled Action 1" />
            <Button onPress={() => console.log('Styled 2')} label="Styled Action 2" />
          </Menu>
        </Section>

        <Section title="Menu with primary action">
          <Menu
            label="Tap or Hold"
            systemImage="play.circle"
            onPrimaryAction={() => console.log('Primary action triggered!')}>
            <Button onPress={() => console.log('Menu Item 1')} label="Menu Item 1" />
            <Button onPress={() => console.log('Menu Item 2')} label="Menu Item 2" />
            <Button onPress={() => console.log('Menu Item 3')} label="Menu Item 3" />
          </Menu>
        </Section>

        <Section title="Menu with glass button">
          <Menu label="Glass Button" modifiers={[buttonStyle('glass')]}>
            <Button onPress={() => console.log('Menu Item 1')} label="Menu Item 1" />
            <Button onPress={() => console.log('Menu Item 2')} label="Menu Item 2" />
            <Button onPress={() => console.log('Menu Item 3')} label="Menu Item 3" />
          </Menu>
        </Section>

        <Section title="Menu with Icon Only Button">
          <Menu label="Icon Only Button" modifiers={[labelStyle('iconOnly')]} systemImage="gear">
            <Button onPress={() => console.log('Menu Item 1')} label="Menu Item 1" />
            <Button onPress={() => console.log('Menu Item 2')} label="Menu Item 2" />
            <Button onPress={() => console.log('Menu Item 3')} label="Menu Item 3" />
          </Menu>
        </Section>

        <Section title="Apple Music-style Menu">
          <Menu label="Song Options" systemImage="ellipsis.circle">
            <ControlGroup>
              <Button systemImage="plus" label="Add" onPress={() => console.log('Add')} />
              <Button systemImage="star" label="Favorite" onPress={() => console.log('Favorite')} />
              <Button
                systemImage="square.and.arrow.up"
                label="Share"
                onPress={() => console.log('Share')}
              />
            </ControlGroup>
            <Section>
              <Button
                systemImage="text.badge.plus"
                label="Add to a Playlist"
                onPress={() => console.log('Add to Playlist')}
              />
              <Button
                systemImage="antenna.radiowaves.left.and.right"
                label="Create Station"
                onPress={() => console.log('Create Station')}
              />
            </Section>
            <Section>
              <Button onPress={() => console.log('Go to Album')}>
                <Image systemName="square.stack" />
                <Text>Go to Album</Text>
                <Text>Atado a Tu Amor</Text>
              </Button>
              <Button onPress={() => console.log('Go to Artist')}>
                <Image systemName="mic" />
                <Text>Go to Artist</Text>
                <Text>Chayanne</Text>
              </Button>
            </Section>
            <Section>
              <Button
                systemImage="info.circle"
                label="View Credits"
                onPress={() => console.log('View Credits')}
              />
              <Button
                systemImage="quote.bubble"
                label="Share Lyrics"
                onPress={() => console.log('Share Lyrics')}
              />
            </Section>
            <Button
              systemImage="hand.thumbsdown"
              label="Suggest Less"
              onPress={() => console.log('Suggest Less')}
            />
          </Menu>
        </Section>
      </List>
    </Host>
  );
}

MenuScreen.navigationOptions = {
  title: 'Menu',
};
