import { Host, Column, Text, ScrollView } from '@expo/ui';

export default function TextScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Default</Text>
            <Text>Hello world</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Font sizes</Text>
            <Text textStyle={{ fontSize: 12 }}>12pt font size</Text>
            <Text textStyle={{ fontSize: 16 }}>16pt font size</Text>
            <Text textStyle={{ fontSize: 20 }}>20pt font size</Text>
            <Text textStyle={{ fontSize: 28 }}>28pt font size</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Font weights</Text>
            <Text textStyle={{ fontSize: 16, fontWeight: '100' }}>Weight 100 - Thin</Text>
            <Text textStyle={{ fontSize: 16, fontWeight: '300' }}>Weight 300 - Light</Text>
            <Text textStyle={{ fontSize: 16, fontWeight: 'normal' }}>Weight normal</Text>
            <Text textStyle={{ fontSize: 16, fontWeight: '500' }}>Weight 500 - Medium</Text>
            <Text textStyle={{ fontSize: 16, fontWeight: 'bold' }}>Weight bold</Text>
            <Text textStyle={{ fontSize: 16, fontWeight: '900' }}>Weight 900 - Black</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Color</Text>
            <Text textStyle={{ color: '#007AFF' }}>Blue text</Text>
            <Text textStyle={{ color: '#E53935' }}>Red text</Text>
            <Text textStyle={{ color: '#43A047' }}>Green text</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Letter spacing</Text>
            <Text textStyle={{ letterSpacing: 0 }}>Default spacing</Text>
            <Text textStyle={{ letterSpacing: 2 }}>Spacing 2</Text>
            <Text textStyle={{ letterSpacing: 6 }}>Spacing 6</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Line height</Text>
            <Text textStyle={{ fontSize: 14, lineHeight: 14 }}>
              Line height 14 (tight). This text demonstrates tight line spacing when wrapping across
              multiple lines in the container.
            </Text>
            <Text textStyle={{ fontSize: 14, lineHeight: 28 }}>
              Line height 28 (loose). This text demonstrates loose line spacing when wrapping across
              multiple lines in the container.
            </Text>
          </Column>

          <Column spacing={8} style={{ width: 300 }}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Text align</Text>
            <Text textStyle={{ textAlign: 'left' }}>
              Left aligned text that wraps across multiple lines to demonstrate alignment
            </Text>
            <Text textStyle={{ textAlign: 'center' }}>
              Center aligned text that wraps across multiple lines to demonstrate alignment
            </Text>
            <Text textStyle={{ textAlign: 'right' }}>
              Right aligned text that wraps across multiple lines to demonstrate alignment
            </Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Truncation</Text>
            <Text numberOfLines={1}>
              Single line truncation: this is a very long text that should be truncated after one
              line because it overflows the available space
            </Text>
            <Text numberOfLines={2}>
              Two line truncation: this is a very long text that should be truncated after two
              lines. It keeps going and going to demonstrate multi-line truncation behavior in the
              universal text component.
            </Text>
          </Column>

          <Column style={{ height: 40 }} />
        </Column>
      </ScrollView>
    </Host>
  );
}

TextScreen.navigationOptions = {
  title: 'Text',
};
