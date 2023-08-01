// Test that the global CSS is statically extracted
import { Text } from 'react-native';

import '../global.css';
import { unstable_styles } from '../test.module.css';

export default function Page() {
  return (
    <Text testID="styled-text" style={unstable_styles.text}>
      Hello World
    </Text>
  );
}
