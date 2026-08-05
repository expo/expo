import { Host, Card, Column, LazyColumn, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';

export default function TextScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Basic Text</Text>
            <Text>Hello world {123}</Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Nested Text</Text>
            <Text style={{ fontWeight: 'bold' }}>
              Hello <Text style={{ fontStyle: 'italic' }}>world</Text>!
            </Text>
            <Text>
              Normal,{' '}
              <Text style={{ fontStyle: 'italic' }}>
                italic <Text style={{ fontWeight: 'bold' }}>bold italic</Text>
              </Text>
              , <Text style={{ fontWeight: 'bold' }}>bold</Text>
            </Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Nested Text with Color</Text>
            <Text style={{ fontSize: 18 }}>
              Hello{' '}
              <Text color="#ff0000" style={{ fontWeight: 'bold' }}>
                red bold
              </Text>{' '}
              world
            </Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Text Decoration</Text>
            <Text style={{ fontSize: 16 }}>
              Normal <Text style={{ textDecoration: 'underline' }}>underlined</Text> and{' '}
              <Text style={{ textDecoration: 'lineThrough' }}>strikethrough</Text>
            </Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Typography Styles</Text>
            <Text style={{ typography: 'displaySmall' }}>Display Small</Text>
            <Text style={{ typography: 'headlineMedium' }}>Headline Medium</Text>
            <Text style={{ typography: 'titleLarge' }}>Title Large</Text>
            <Text style={{ typography: 'bodyLarge' }}>Body Large</Text>
            <Text style={{ typography: 'labelMedium' }}>Label Medium</Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Font Weights</Text>
            <Text style={{ fontWeight: '100', fontSize: 16 }}>Weight 100 - Thin</Text>
            <Text style={{ fontWeight: '300', fontSize: 16 }}>Weight 300 - Light</Text>
            <Text style={{ fontWeight: 'normal', fontSize: 16 }}>Weight Normal</Text>
            <Text style={{ fontWeight: '500', fontSize: 16 }}>Weight 500 - Medium</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Weight Bold</Text>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Weight 900 - Black</Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Text Overflow</Text>
            <Text maxLines={1} overflow="ellipsis">
              This is a very long text that should be truncated with an ellipsis after one line
              because it overflows the available space
            </Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Font Families</Text>
            <Text color="#666666" style={{ typography: 'bodySmall' }}>
              System fonts and custom fonts loaded via expo-font.
            </Text>
            <Text style={{ fontFamily: 'sansSerif', fontSize: 16 }}>Sans Serif</Text>
            <Text style={{ fontFamily: 'serif', fontSize: 16 }}>Serif</Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 16 }}>Monospace</Text>
            <Text style={{ fontFamily: 'cursive', fontSize: 16 }}>Cursive</Text>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16 }}>Inter Bold (custom)</Text>
            <Text style={{ fontFamily: 'Inter-Light', fontSize: 16 }}>Inter Light (custom)</Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16 }}>
              Inter Regular (custom)
            </Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Shadow</Text>
            <Text
              color="#007AFF"
              style={{
                fontSize: 20,
                shadow: { color: '#007AFF', offsetX: 1, offsetY: 3, blurRadius: 8 },
              }}>
              Blue glow
            </Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Background</Text>
            <Text style={{ fontSize: 16, background: '#FFEB3B' }}>Highlighted text</Text>
            <Text style={{ fontSize: 16 }}>
              Normal with{' '}
              <Text style={{ background: '#C8E6C9', fontWeight: 'bold' }}>highlighted span</Text>{' '}
              inline
            </Text>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text style={{ typography: 'titleMedium' }}>Nested Font Family Mix</Text>
            <Text style={{ fontSize: 16, fontFamily: 'serif' }}>
              Serif base with{' '}
              <Text style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>monospace bold</Text>{' '}
              inline
            </Text>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

TextScreen.navigationOptions = {
  title: 'Text',
};
