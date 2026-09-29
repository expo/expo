import * as ScreenCapture from 'expo-screen-capture';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BodyText } from '../components/BodyText';
import HeadingText from '../components/HeadingText';
import TitleSwitch from '../components/TitledSwitch';

function KeyedProtectionSwitch({ holderKey }: { holderKey: string }) {
  const [isHolding, setHolding] = React.useState(false);

  React.useEffect(() => {
    if (isHolding) {
      ScreenCapture.preventScreenCaptureAsync(holderKey);
    } else {
      ScreenCapture.allowScreenCaptureAsync(holderKey);
    }
  }, [isHolding]);

  React.useEffect(() => {
    return () => {
      ScreenCapture.allowScreenCaptureAsync(holderKey);
    };
  }, []);

  return (
    <TitleSwitch
      title={`Hold protection with key '${holderKey}'`}
      value={isHolding}
      setValue={setHolding}
      style={styles.switchSpacing}
    />
  );
}

export default function ScreenCaptureAdvancedScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeadingText style={styles.heading}>Multiple Protection Holders</HeadingText>
      <BodyText style={styles.description}>
        Each key holds protection independently. Screenshots stay blank, and the app keeps
        rendering, while any key is held.
      </BodyText>
      <KeyedProtectionSwitch holderKey="a" />
      <KeyedProtectionSwitch holderKey="b" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
  },
  description: {
    padding: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  switchSpacing: {
    marginTop: 16,
  },
  heading: {
    marginTop: 24,
    marginBottom: 8,
  },
});
