// Test that the global CSS is statically extracted
import { Text } from 'react-native';

import { Page } from '@/components/Page';
import '@/styles/global.css';
import { unstable_styles } from '@/styles/test.module.css';

export default function StyledRoute() {
  return (
    <Page title="Styled" testID="rendering-styled">
      <Text testID="styled-text" style={unstable_styles.text}>
        Hello World
      </Text>
    </Page>
  );
}
