import { Text } from 'react-native';

import '../second.css';

export default function Page() {
  return (
    <>
      <Text testID="index-text" style={{ $$css: true, _: 'collide' }}>
        Index
      </Text>
    </>
  );
}
