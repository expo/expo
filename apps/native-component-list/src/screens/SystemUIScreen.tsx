import { Platform } from 'expo-modules-core';
import * as SystemUI from 'expo-system-ui';
import * as React from 'react';
import { ColorValue, Text, useColorScheme, ScrollView } from 'react-native';

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
        {Platform.OS === 'android' && (
          <Section title="User Interface Style">
            <UserInterfaceStyleExample />
          </Section>
        )}
      </Page>
    </ScrollView>
  );
}

SystemUIScreen.navigationOptions = {
  title: 'Navigation Bar',
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
        title={`Get background color to random color: ${color?.toString()}`}
      />
    </>
  );
}

const SystemUIUserInterfaceStyles: SystemUI.SystemUIUserInterfaceStyle[] = [
  'light',
  'dark',
  'automatic',
];

function UserInterfaceStyleExample() {
  const scheme = useColorScheme();
  const [style, setStyle] = React.useState<SystemUI.SystemUIUserInterfaceStyle>('light');

  const nextStyle = React.useMemo(() => {
    const index = SystemUIUserInterfaceStyles.indexOf(style);
    const newIndex = (index + 1) % SystemUIUserInterfaceStyles.length;
    return SystemUIUserInterfaceStyles[newIndex];
  }, [style]);

  const onPress = React.useCallback(() => {
    SystemUI.setUserInterfaceStyleAsync(nextStyle);
    setStyle(nextStyle);
  }, [nextStyle]);

  return (
    <>
      <Button onPress={onPress} title={`User Interface Style: ${nextStyle}`} />
      <Text>Current: {scheme}</Text>
    </>
  );
}
