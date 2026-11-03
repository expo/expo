import { Text } from 'react-native';

import '../second.css';
import '../cascade-a.css';
import '../cascade-b.css';

export default function Page() {
  return (
    <>
      <Text testID="index-text" style={{ $$css: true, _: 'collide' }}>
        Index
      </Text>
      <Text testID="cascade-between" style={{ $$css: true, _: 'cascade-between' }}>
        External B overrides bundled A
      </Text>
      <Text testID="cascade-bundled" style={{ $$css: true, _: 'cascade-bundled' }}>
        Bundled B overrides external B
      </Text>
    </>
  );
}
