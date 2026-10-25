import { Text } from 'react-native';

import { DemoScreen, DemoSection } from '../../components/demo-screen';

export default function ScreenB() {
  return (
    <DemoScreen title="Screen B">
      <DemoSection title="Activity">
        <Text>The home screen is hidden at this depth. Go back to check its state.</Text>
      </DemoSection>
    </DemoScreen>
  );
}
