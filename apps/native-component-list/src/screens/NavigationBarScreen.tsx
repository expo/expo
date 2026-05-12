import { NavigationBar, NavigationBarStyle } from 'expo-navigation-bar';
import * as React from 'react';
import { Platform, ScrollView, Text } from 'react-native';

import Button from '../components/Button';
import { Page, Section } from '../components/Page';

export default function NavigationBarScreen() {
  return (
    <ScrollView>
      <Page>
        {Platform.OS !== 'android' && (
          <Text style={{ marginVertical: 8, fontSize: 16 }}>⚠️ NavigationBar is Android-only</Text>
        )}
        <Section title="Appearance">
          <StyleExample />
        </Section>
        <Section title="Visibility">
          <HiddenExample />
        </Section>
      </Page>
    </ScrollView>
  );
}

NavigationBarScreen.navigationOptions = {
  title: 'Navigation Bar',
};

const STYLES: NavigationBarStyle[] = ['auto', 'inverted', 'light', 'dark'];

function StyleExample() {
  const [style, setStyle] = React.useState<NavigationBarStyle>('auto');
  const nextStyle = STYLES[STYLES.findIndex((item) => item === style) + 1] ?? 'auto';

  React.useEffect(() => {
    NavigationBar.setStyle('auto');
    return () => NavigationBar.setStyle('auto');
  }, []);

  return (
    <Button
      title={`Toggle style: ${nextStyle}`}
      onPress={() => {
        NavigationBar.setStyle(nextStyle);
        setStyle(nextStyle);
      }}
    />
  );
}

function HiddenExample() {
  const [hidden, setHidden] = React.useState(false);
  const nextHidden = !hidden;

  React.useEffect(() => {
    NavigationBar.setHidden(false);
    return () => NavigationBar.setHidden(false);
  }, []);

  return (
    <Button
      title={`Toggle hidden: ${nextHidden}`}
      onPress={() => {
        NavigationBar.setHidden(nextHidden);
        setHidden(nextHidden);
      }}
    />
  );
}
