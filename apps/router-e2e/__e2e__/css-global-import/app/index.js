import { Text } from 'react-native';

import '../global.css';

export default function Page() {
  return (
    <>
      <Text testID="index-text" style={{ $$css: true, _: 'collide' }}>
        Index
      </Text>
      <Text testID="beta-text" style={{ $$css: true, _: 'beta' }}>
        Index
      </Text>
    </>
  );
}
