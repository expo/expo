import * as ScreenCapture from 'expo-screen-capture';
import React from 'react';
import { Button, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { BodyText } from '../components/BodyText';
import HeadingText from '../components/HeadingText';
import TitleSwitch from '../components/TitledSwitch';

function GuardedSvgSheet({ onClose }: { onClose: () => void }) {
  ScreenCapture.usePreventScreenCapture('guarded-sheet');

  return (
    <View style={styles.sheet}>
      <View style={styles.svgGrid}>
        {Array.from({ length: 12 }, (_, index) => (
          <Svg key={index} width={72} height={48}>
            <Rect x={0} y={0} width={72} height={48} rx={8} fill="#4630eb" />
            <Circle cx={16} cy={24} r={10} fill="#fc0" />
            <Path d="M30 38 L42 10 L54 38 Z" fill="#0f9" />
            <Path d="M56 12 h12 v24 h-12 Z" fill="#f36" stroke="#fff" strokeWidth={2} />
          </Svg>
        ))}
      </View>
      <BodyText style={styles.description}>
        Every tile must show all four shapes each time this sheet opens.
      </BodyText>
      <Button title="Close guarded sheet" onPress={onClose} />
    </View>
  );
}

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
  const [isSheetVisible, setSheetVisible] = React.useState(false);
  const [isAutoCycling, setAutoCycling] = React.useState(false);

  React.useEffect(() => {
    if (!isAutoCycling) {
      return;
    }
    const interval = setInterval(() => setSheetVisible((visible) => !visible), 1200);
    return () => clearInterval(interval);
  }, [isAutoCycling]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeadingText style={styles.heading}>Draw-Backed Content Under Protection</HeadingText>
      <BodyText style={styles.description}>
        The sheet arms screenshot prevention while SVG content mounts. The content must render fully
        every time it opens, and screenshots of it must be blank.
      </BodyText>
      <Button
        title={isSheetVisible ? 'Hide guarded SVG sheet' : 'Show guarded SVG sheet'}
        onPress={() => setSheetVisible((visible) => !visible)}
      />
      <TitleSwitch
        title="Auto cycle sheet"
        value={isAutoCycling}
        setValue={setAutoCycling}
        style={styles.switchSpacing}
      />
      {isSheetVisible && <GuardedSvgSheet onClose={() => setSheetVisible(false)} />}

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
  sheet: {
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#00000010',
  },
  svgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    maxWidth: 320,
  },
  heading: {
    marginTop: 24,
    marginBottom: 8,
  },
});
