import * as SystemUI from 'expo-system-ui';
import * as React from 'react';
import { Button } from 'react-native';

import { Page, Section } from '../components/Page';

export default function SystemUIScreen() {
  return (
    <Page>
      <Section title="System UI Visibility">
        <SetNavigationBarVisibilityExample />
      </Section>
      <Section title="Status Bar Color">
        <SetStatusBarColorExample />
      </Section>
      <Section title="Navigation Bar Color">
        <SetNavigationBarColorExample />
      </Section>
      <Section title="Navigation Bar Divider Color">
        <SetNavigationBarDividerColorExample />
      </Section>
      <Section title="Edge-to-edge mode example">
        <EdgeToEdgeModeExample />
      </Section>
      {/* <Section title="Appearance">
        <SetAppearanceExample />
      </Section> */}
    </Page>
  );
}

SystemUIScreen.navigationOptions = {
  title: 'System UI',
};

function SetNavigationBarVisibilityExample() {
  const [statusBarVisibility, setStatusBarVisibility] = React.useState<'visible' | 'hidden'>(
    'visible'
  );
  const [navigationBarVisibility, setNavigationBarVisibility] = React.useState<
    'visible' | 'hidden'
  >('visible');

  const toggleNavigationBar = React.useCallback(() => {
    setNavigationBarVisibility((currentValue) => {
      const newValue = currentValue === 'visible' ? 'hidden' : 'visible';
      SystemUI.setNavigationBarVisibility(newValue);
      return newValue;
    });
  }, []);
  const toggleStatusBar = React.useCallback(() => {
    setStatusBarVisibility((currentValue) => {
      const newValue = currentValue === 'visible' ? 'hidden' : 'visible';
      SystemUI.setStatusBarVisibility(newValue);
      return newValue;
    });
  }, []);

  return (
    <>
      <Button
        onPress={toggleNavigationBar}
        title={navigationBarVisibility === 'hidden' ? 'Show Navigation Bar' : 'Hide Navigation Bar'}
      />
      <Button
        onPress={toggleStatusBar}
        title={statusBarVisibility === 'hidden' ? 'Show Status Bar' : 'Hide Status Bar'}
      />
    </>
  );
}

function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function SetNavigationBarColorExample() {
  const [style, setStyle] = React.useState<'light' | 'dark'>('light');
  const nextStyle = style === 'light' ? 'dark' : 'light';
  return (
    <>
      <Button
        onPress={() => {
          SystemUI.setNavigationBarBackgroundColor(getRandomColor());
        }}
        title="Set Navigation Bar to random color"
      />
      <Button
        onPress={() => {
          SystemUI.setNavigationBarForegroundStyle(nextStyle);
          setStyle(nextStyle);
        }}
        title={`Set Navigation Bar Style to ${nextStyle}`}
      />
    </>
  );
}

function SetNavigationBarDividerColorExample() {
  return (
    <>
      <Button
        onPress={() => {
          SystemUI.setNavigationBarDividerColor(getRandomColor());
        }}
        title="Set Navigation Bar Divider to random color"
      />
    </>
  );
}

function SetStatusBarColorExample() {
  const [style, setStyle] = React.useState<'light' | 'dark'>('light');
  const nextStyle = style === 'light' ? 'dark' : 'light';
  return (
    <>
      <Button
        onPress={() => {
          SystemUI.setStatusBarBackgroundColor(getRandomColor());
        }}
        title="Set Status Bar to random color"
      />
      <Button
        onPress={() => {
          SystemUI.setStatusBarForegroundStyle(nextStyle);
          setStyle(nextStyle);
        }}
        title={`Set Status Bar Style to ${nextStyle}`}
      />
    </>
  );
}

const systemUiBehaviors: SystemUI.SystemUIBehavior[] = [
  'inset-swipe',
  'inset-touch',
  'overlay-swipe',
];

function EdgeToEdgeModeExample() {
  const [isEdgeToEdge, setIsEdgeToEdge] = React.useState(false);
  const [systemUIBehavior, setSystemUiBehavior] =
    React.useState<SystemUI.SystemUIBehavior>('inset-swipe');

  const onPress = React.useCallback(() => {
    setIsEdgeToEdge((is) => {
      const newValue = !is;
      SystemUI.setNavigationBarBackgroundColor(newValue ? '#ff000000' : '#ff0000ff');
      SystemUI.setStatusBarBackgroundColor(newValue ? '#ff000000' : '#ff0000ff');
      SystemUI.setDrawsBehindSystemUI(newValue);
      return newValue;
    });
  }, []);

  const nextSystemUiBehavior = React.useMemo(() => {
    const index = systemUiBehaviors.indexOf(systemUIBehavior);
    const newIndex = (index + 1) % systemUiBehaviors.length;
    return systemUiBehaviors[newIndex];
  }, [systemUIBehavior]);

  const onPressBehavior = React.useCallback(() => {
    SystemUI.setSystemUIBehavior(nextSystemUiBehavior);
    setSystemUiBehavior(nextSystemUiBehavior);
  }, [nextSystemUiBehavior]);

  return (
    <>
      <Button
        onPress={onPress}
        title={`${isEdgeToEdge ? 'Disable' : 'Enable'} Edge-to-Edge Mode`}
      />
      <Button
        onPress={onPressBehavior}
        title={`Set System UI behavior to ${nextSystemUiBehavior}`}
      />
    </>
  );
}

// const appearances: Appearance[] = ['light', 'dark', 'auto', 'unspecified'];

// function SetAppearanceExample() {
//   const [appearance, setAppearance] = React.useState<Appearance>(appearances[0]);

//   const nextValue = React.useMemo(() => {
//     const index = appearances.indexOf(appearance);
//     const newValue = appearances[(index + 1) % appearances.length];
//     return newValue;
//   }, [appearance]);
//   const onPress = React.useCallback(() => {
//     // TODO: Implement SystemUI.setAppearance(nextValue);
//     setAppearance(nextValue);
//   }, [nextValue]);

//   return (
//     <>
//       <Button onPress={onPress} title={`Set Appearance to ${nextValue}`} />
//     </>
//   );
// }
