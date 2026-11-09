import { Text } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';

export default function FontsRoute() {
  return (
    <Page title="Fonts" testID="rendering-fonts">
      {/* Inline styles reach the HTML as a `style` attribute, which the font tests read. */}
      <Text testID="fonts-text" style={{ color: colors.text, fontFamily: 'sweet', fontSize: 32 }}>
        Sweet
      </Text>
    </Page>
  );
}
