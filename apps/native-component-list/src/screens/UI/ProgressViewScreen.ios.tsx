import { Button, Host, Form, ProgressView, Section, Text } from '@expo/ui/swift-ui';
import { progressViewStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function ProgressViewScreen() {
  const [progress, setProgress] = useState(0.5);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Indeterminate">
          <ProgressView />
        </Section>
        <Section title="Determinate">
          <ProgressView value={progress} />
          <Button label="0%" onPress={() => setProgress(0)} />
          <Button label="50%" onPress={() => setProgress(0.5)} />
          <Button label="100%" onPress={() => setProgress(1)} />
        </Section>
        <Section title="With Label">
          <ProgressView value={progress}>
            <Text>Loading...</Text>
          </ProgressView>
          <ProgressView value={progress} modifiers={[progressViewStyle('circular')]}>
            <Text>{Math.round(progress * 40)}%</Text>
          </ProgressView>
        </Section>
        <Section title="With Tint">
          <ProgressView value={progress} modifiers={[tint('red')]} />
          <ProgressView modifiers={[tint('red')]} />
        </Section>
        <Section title="Timer (iOS 16+)">
          <ProgressView
            timerInterval={{
              lower: new Date(),
              upper: new Date(Date.now() + 100000),
            }}
          />
          <ProgressView
            timerInterval={{
              lower: new Date(),
              upper: new Date(Date.now() + 100000),
            }}
            countsDown={false}>
            <Text>Countdown</Text>
          </ProgressView>
        </Section>
      </Form>
    </Host>
  );
}

ProgressViewScreen.navigationOptions = {
  title: 'ProgressView',
};
