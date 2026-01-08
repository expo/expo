import { Host, Progress, VStack } from '@expo/ui/swift-ui';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function ProgressScreen() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((progress) => (progress + 0.05) % 1);
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Page>
      <Section title="Indeterminate progress" gap={16}>
        <Host matchContents>
          <VStack spacing={16}>
            <Progress variant="circular" />
            <Progress variant="linear" />
          </VStack>
        </Host>
      </Section>
      <Section title="Determinate progress" gap={16}>
        <Host matchContents>
          <VStack spacing={16}>
            <Progress progress={progress} variant="circular" />
            <Progress progress={progress} variant="linear" />
          </VStack>
        </Host>
      </Section>
      <Section title="Color" gap={16}>
        <Host matchContents>
          <VStack spacing={16}>
            <Progress progress={progress} color="red" variant="circular" />
            <Progress progress={progress} color="red" variant="linear" />
          </VStack>
        </Host>
      </Section>
    </Page>
  );
}

ProgressScreen.navigationOptions = {
  title: 'Progress',
};
