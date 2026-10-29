import { Text } from 'react-native';

import { DemoButton, DemoScreen, DemoSection } from '../../components/demo-screen';

export default function ScreenA() {
  return (
    <DemoScreen title="Screen A">
      <DemoSection title="Activity">
        <Text>The home screen is still visible at this depth.</Text>
      </DemoSection>
      <DemoButton testID="e2e-goto-b" href="/navigation-aware-activity/b" title="Go to Screen B" />
    </DemoScreen>
  );
}
