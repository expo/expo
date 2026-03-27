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
        <Section title="Visibility">
          <VisibilityExample />
        </Section>
        <Section title="Appearance">
          <ButtonStyleExample />
        </Section>
      </Page>
    </ScrollView>
  );
}

NavigationBarScreen.navigationOptions = {
  title: 'Navigation Bar',
};

function VisibilityExample() {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    return () => NavigationBar.setHidden(false);
  }, []);

  return (
    <Button
      title={`Toggle hidden: ${!hidden}`}
      onPress={() => {
        NavigationBar.setHidden(!hidden);
        setHidden(!hidden);
      }}
    />
  );
}

function ButtonStyleExample() {
  const [style, setStyle] = React.useState<NavigationBarStyle>('light');
  const nextStyle = style === 'light' ? 'dark' : 'light';
  return (
    <Button
      onPress={() => {
        NavigationBar.setStyle(nextStyle);
        setStyle(nextStyle);
      }}
      title={`Toggle bar style: ${nextStyle}`}
    />
  );
}
