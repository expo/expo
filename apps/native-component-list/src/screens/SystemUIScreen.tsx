import * as SystemUI from 'expo-system-ui';
import * as React from 'react';
import { ColorValue, ScrollView, View } from 'react-native';

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
        <Section title="System Bars">
          <SystemBarsExample />
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

const STYLES_VALUES: SystemUI.SystemBarStyle[] = ['auto', 'light', 'dark'];

function SystemBarsExample() {
  const [statusBarStyle, setStatusBarStyle] = React.useState(STYLES_VALUES[0]);
  const [statusBarHidden, setStatusBarHidden] = React.useState(false);
  const [navigationBarHidden, setNavigationBarHidden] = React.useState(false);

  return (
    <>
      <Button onPress={() => setStatusBarStyle('auto')} title="Set status bar style to auto" />
      <Button onPress={() => setStatusBarStyle('light')} title="Set status bar style to light" />
      <Button onPress={() => setStatusBarStyle('dark')} title="Set status bar style to dark" />

      <View collapsable style={{ height: 20 }} />

      <Button onPress={() => setStatusBarHidden(true)} title="Hide status bar" />
      <Button onPress={() => setStatusBarHidden(false)} title="Show status bar" />

      <View collapsable style={{ height: 20 }} />

      <Button onPress={() => setNavigationBarHidden(true)} title="Hide navigation bar" />
      <Button onPress={() => setNavigationBarHidden(false)} title="Show navigation bar" />

      <SystemUI.SystemBars
        statusBarStyle={statusBarStyle}
        statusBarHidden={statusBarHidden}
        navigationBarHidden={navigationBarHidden}
      />
    </>
  );
}
