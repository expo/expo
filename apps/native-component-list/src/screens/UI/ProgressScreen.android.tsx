import {
  CircularProgress,
  LinearProgress,
  CircularWavyProgress,
  LinearWavyProgress,
  Host,
} from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView } from 'react-native';

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
      <ScrollView>
        <Section title="Indeterminate progress" gap={16}>
          <Host matchContents>
            <CircularProgress />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearProgress />
          </Host>
        </Section>
        <Section title="Determinate progress" gap={16}>
          <Host matchContents>
            <CircularProgress progress={progress} />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearProgress progress={progress} />
          </Host>
        </Section>
        <Section title="Color" gap={16}>
          <Host matchContents>
            <CircularProgress progress={progress} color="red" />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearProgress progress={progress} color="red" />
          </Host>
        </Section>
        <Section title="Track color" gap={16}>
          <Host matchContents>
            <CircularProgress elementColors={{ trackColor: '#cccccc' }} />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearProgress elementColors={{ trackColor: '#cccccc' }} />
          </Host>
        </Section>
        <Section title="Wavy - Indeterminate progress" gap={16}>
          <Host matchContents>
            <CircularWavyProgress />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearWavyProgress />
          </Host>
        </Section>
        <Section title="Wavy - Determinate progress" gap={16}>
          <Host matchContents>
            <CircularWavyProgress progress={progress} />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearWavyProgress progress={progress} />
          </Host>
        </Section>
        <Section title="Wavy - Color" gap={16}>
          <Host matchContents>
            <CircularWavyProgress progress={progress} color="red" />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearWavyProgress progress={progress} color="red" />
          </Host>
        </Section>
        <Section title="Wavy - Track color" gap={16}>
          <Host matchContents>
            <CircularWavyProgress elementColors={{ trackColor: '#cccccc' }} />
          </Host>
          <Host matchContents={{ vertical: true }}>
            <LinearWavyProgress elementColors={{ trackColor: '#cccccc' }} />
          </Host>
        </Section>
      </ScrollView>
    </Page>
  );
}

ProgressScreen.navigationOptions = {
  title: 'Progress',
};
