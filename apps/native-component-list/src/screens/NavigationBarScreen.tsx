import { NavigationBar, NavigationBarStyle } from 'expo-navigation-bar';
import * as React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BodyText } from '../components/BodyText';
import Button from '../components/Button';
import { Page, Section } from '../components/Page';

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  currentValue: {
    fontWeight: '700',
  },
  buttonsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
});

export default function NavigationBarScreen() {
  return (
    <ScrollView>
      <Page>
        {Platform.OS !== 'android' && (
          <BodyText style={{ marginVertical: 8, fontSize: 16 }}>
            ⚠️ NavigationBar is Android-only
          </BodyText>
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

  React.useEffect(() => {
    NavigationBar.setStyle('auto');
    return () => NavigationBar.setStyle('auto');
  }, []);

  return (
    <View style={styles.section}>
      <Text>
        Current: <Text style={styles.currentValue}>{style}</Text>
      </Text>

      <View style={styles.buttonsRow}>
        <Text>Toggle:</Text>

        {STYLES.map((nextStyle) => (
          <Button
            key={`set-style-btn-${nextStyle}`}
            title={nextStyle}
            onPress={() => {
              NavigationBar.setStyle(nextStyle);
              setStyle(nextStyle);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function HiddenExample() {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    NavigationBar.setHidden(false);
    return () => NavigationBar.setHidden(false);
  }, []);

  return (
    <View style={styles.section}>
      <Text>
        Current: <Text style={styles.currentValue}>{String(hidden)}</Text>
      </Text>

      <View style={styles.buttonsRow}>
        <Text>Toggle:</Text>

        {[true, false].map((nextHidden) => (
          <Button
            key={`set-hidden-btn-${nextHidden}`}
            title={String(nextHidden)}
            onPress={() => {
              NavigationBar.setHidden(nextHidden);
              setHidden(nextHidden);
            }}
          />
        ))}
      </View>
    </View>
  );
}
