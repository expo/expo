import * as NavigationBar from 'expo-navigation-bar';
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
  const visibility = NavigationBar.useVisibility();
  const nextVisibility = visibility === 'visible' ? 'hidden' : 'visible';
  return (
    <Button
      title={`Toggle Visibility: ${nextVisibility}`}
      onPress={() => {
        NavigationBar.setVisibilityAsync(nextVisibility);
      }}
    />
  );
}

function ButtonStyleExample() {
  const [style, setStyle] = React.useState<NavigationBar.NavigationBarStyle>('light');
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
