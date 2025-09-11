import { CircularProgress, Host, LinearProgress, VStack } from '@expo/ui/swift-ui';
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
            <CircularProgress />
            <LinearProgress />
          </VStack>
        </Host>
      </Section>
      <Section title="Determinate progress" gap={16}>
        <Host matchContents>
          <VStack spacing={16}>
            <CircularProgress progress={progress} />
            <LinearProgress progress={progress} />
          </VStack>
        </Host>
      </Section>
      <Section title="Color" gap={16}>
        <Host matchContents>
          <VStack spacing={16}>
            <CircularProgress progress={progress} color="red" />
            <LinearProgress progress={progress} color="red" />
          </VStack>
        </Host>
      </Section>
    </Page>
  );
}

ProgressScreen.navigationOptions = {
  title: 'Progress',
};
