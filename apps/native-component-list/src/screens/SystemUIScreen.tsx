import * as SystemUI from 'expo-system-ui';
import * as React from 'react';
import { ColorValue, ScrollView } from 'react-native';

import Button from '../components/Button';
import { Page, Section } from '../components/Page';
import { getRandomColor } from '../utilities/getRandomColor';

export default function SystemUIScreen() {
  return (
    <ScrollView>
      <Page>
        <Section title="Background Color">
          <BackgroundColorExample />
        </Section>
        <Section title="Status Bar Style">
          <StatusBarStyleExample />
        </Section>
        <Section title="Navigation Bar Style">
          <NavigationBarStyleExample />
        </Section>
      </Page>
    </ScrollView>
  );
}

SystemUIScreen.navigationOptions = {
  title: 'System UI',
};

function BackgroundColorExample() {
  const [color, setColor] = React.useState<ColorValue | null>(null);

  return (
    <>
      <Button
        onPress={() => SystemUI.setBackgroundColorAsync(getRandomColor())}
        title="Set background color to random color"
      />
      <Button
        onPress={async () => setColor(await SystemUI.getBackgroundColorAsync())}
        title={`Get background color: ${color?.toString()}`}
      />
    </>
  );
}

function StatusBarStyleExample() {
  return (
    <>
      <Button
        onPress={() => SystemUI.setStatusBarStyle('light-content')}
        title="Set light-content"
      />
      <Button onPress={() => SystemUI.setStatusBarStyle('dark-content')} title="Set dark-content" />
    </>
  );
}

function NavigationBarStyleExample() {
  return (
    <>
      <Button
        onPress={() => SystemUI.setNavigationBarStyle('light-content')}
        title="Set light-content"
      />
      <Button
        onPress={() => SystemUI.setNavigationBarStyle('dark-content')}
        title="Set dark-content"
      />
    </>
  );
}
