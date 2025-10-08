import { CircularProgress, LinearProgress, Host } from '@expo/ui/jetpack-compose';
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
        <Host style={{ width: 30, height: 30 }}>
          <CircularProgress />
        </Host>
        <Host>
          <LinearProgress />
        </Host>
      </Section>
      <Section title="Determinate progress" gap={16}>
        <Host style={{ width: 30, height: 30 }}>
          <CircularProgress progress={progress} />
        </Host>
        <Host>
          <LinearProgress progress={progress} />
        </Host>
      </Section>
      <Section title="Color" gap={16}>
        <Host style={{ width: 30, height: 30 }}>
          <CircularProgress progress={progress} color="red" />
        </Host>
        <Host>
          <LinearProgress progress={progress} color="red" />
        </Host>
      </Section>
      <Section title="Track color" gap={16}>
        <Host style={{ width: 30, height: 30 }}>
          <CircularProgress elementColors={{ trackColor: '#cccccc' }} />
        </Host>
        <Host>
          <LinearProgress elementColors={{ trackColor: '#cccccc' }} />
        </Host>
      </Section>
    </Page>
  );
}

ProgressScreen.navigationOptions = {
  title: 'Progress',
};
