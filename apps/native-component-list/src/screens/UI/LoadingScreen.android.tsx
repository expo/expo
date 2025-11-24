import { Host, LoadingIndicator } from '@expo/ui/jetpack-compose';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function LoadingScreen() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((progress) => (progress + 0.02) % 1);
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Page>
      <Section title="Indeterminate loading" gap={16}>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator />
        </Host>
      </Section>
      <Section title="Indeterminate contained loading" gap={16}>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator variant="contained" />
        </Host>
      </Section>
      <Section title="Determinate loading" gap={16} row>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator variant="contained" progress={progress} />
        </Host>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator progress={progress} />
        </Host>
      </Section>
      <Section title="Indicator color" gap={16} row>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator progress={progress} color="red" />
        </Host>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator variant="contained" progress={progress} color="blue" />
        </Host>
      </Section>
      <Section title="Container color" gap={16} row>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator variant="contained" containerColor="#cccccc" />
        </Host>
        <Host style={{ width: 50, height: 50 }}>
          <LoadingIndicator variant="contained" containerColor="#ff4500" />
        </Host>
      </Section>
    </Page>
  );
}

LoadingScreen.navigationOptions = {
  title: 'Loading',
};
