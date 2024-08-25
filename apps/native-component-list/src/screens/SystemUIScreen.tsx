import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as SystemUI from 'expo-system-ui';
import * as React from 'react';
import { ColorValue, ScrollView, View, Text, Switch } from 'react-native';

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
      <Text style={{ marginBottom: 10 }}>Status bar style</Text>

      <SegmentedControl
        values={STYLES_VALUES}
        selectedIndex={STYLES_VALUES.indexOf(statusBarStyle)}
        onChange={(event) => {
          setStatusBarStyle(STYLES_VALUES[event.nativeEvent.selectedSegmentIndex]);
        }}
      />

      <View
        style={{
          marginVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text>Status bar hidden</Text>
        <Switch value={statusBarHidden} onValueChange={setStatusBarHidden} />
      </View>

      <View
        style={{
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text>Navigation bar hidden</Text>
        <Switch value={navigationBarHidden} onValueChange={setNavigationBarHidden} />
      </View>

      <SystemUI.SystemBars
        statusBarStyle={statusBarStyle}
        statusBarHidden={statusBarHidden}
        navigationBarHidden={navigationBarHidden}
      />
    </>
  );
}
