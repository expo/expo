import { ArrangementView, Host, Image, Picker, ScrollView, Text, VStack } from '@expo/ui/swift-ui';
import {
  arrangementViewStyle,
  background,
  font,
  foregroundStyle,
  frame,
  overlayArrangementEdge,
  padding,
  pickerStyle,
  splitArrangementLayoutRatio,
  tag,
  type ArrangementViewStyle,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

type Axes = 'both' | 'horizontal' | 'vertical';

const STYLES: ArrangementViewStyle[] = ['automatic', 'split', 'overlay'];
const AXES: Axes[] = ['both', 'horizontal', 'vertical'];
const RATIOS = [0, 0.3, 0.5];

const LYRICS = [
  'Fold the page and keep the song',
  'Half for the words, half for the sound',
  'Open wide, the room grows long',
  'Close it up, it comes back around',
  'Tilt it like a book in hand',
  'The lines move over, make some space',
  'Nothing lost along the bend',
  'Every verse still in its place',
];

export default function ArrangementViewScreen() {
  const [style, setStyle] = React.useState<ArrangementViewStyle>('automatic');
  const [axes, setAxes] = React.useState<Axes>('both');
  const [ratio, setRatio] = React.useState(0);

  const styleModifier =
    style === 'automatic'
      ? arrangementViewStyle('automatic')
      : arrangementViewStyle(style, { axes });

  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={8}>
        <VStack spacing={8} modifiers={[padding({ horizontal: 16, top: 8 })]}>
          <Picker
            modifiers={[pickerStyle('segmented')]}
            selection={style}
            onSelectionChange={setStyle}>
            {STYLES.map((value) => (
              <Text key={value} modifiers={[tag(value)]}>
                {value}
              </Text>
            ))}
          </Picker>
          <Picker
            modifiers={[pickerStyle('segmented')]}
            selection={axes}
            onSelectionChange={setAxes}>
            {AXES.map((value) => (
              <Text key={value} modifiers={[tag(value)]}>
                {`axes: ${value}`}
              </Text>
            ))}
          </Picker>
          <Picker
            modifiers={[pickerStyle('segmented')]}
            selection={ratio}
            onSelectionChange={setRatio}>
            {RATIOS.map((value) => (
              <Text key={value} modifiers={[tag(value)]}>
                {value === 0 ? 'ratio: default' : `ratio: ${value}`}
              </Text>
            ))}
          </Picker>
        </VStack>

        <ArrangementView
          modifiers={[styleModifier, frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
          <ArrangementView.Primary>
            <VStack
              spacing={12}
              modifiers={[
                ...(ratio > 0 ? [splitArrangementLayoutRatio(ratio)] : []),
                overlayArrangementEdge('trailing'),
                frame({ maxWidth: Infinity, maxHeight: Infinity }),
                background('#5B4BDB'),
              ]}>
              <Image systemName="music.note" size={64} color="white" />
              <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('white')]}>
                Primary: Now Playing
              </Text>
              <Text modifiers={[foregroundStyle('white')]}>The Fold - Two Displays</Text>
            </VStack>
          </ArrangementView.Primary>
          <ArrangementView.Secondary>
            <ScrollView
              modifiers={[
                frame({ maxWidth: Infinity, maxHeight: Infinity }),
                background('#1F8A70'),
              ]}>
              <VStack alignment="leading" spacing={12} modifiers={[padding({ all: 20 })]}>
                <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('white')]}>
                  Secondary: Lyrics
                </Text>
                {LYRICS.map((line) => (
                  <Text key={line} modifiers={[font({ size: 18 }), foregroundStyle('white')]}>
                    {line}
                  </Text>
                ))}
              </VStack>
            </ScrollView>
          </ArrangementView.Secondary>
        </ArrangementView>
      </VStack>
    </Host>
  );
}

ArrangementViewScreen.navigationOptions = {
  title: 'ArrangementView',
};
