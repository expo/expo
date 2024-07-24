import * as NavigationBar from 'expo-navigation-bar';
import * as React from 'react';
import { Platform, ScrollView, Text } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../components/Button';
import { Page, Section } from '../components/Page';
import { getRandomColor } from '../utilities/getRandomColor';

function usePosition(): [
  NavigationBar.NavigationBarPosition | null,
  (position: NavigationBar.NavigationBarPosition) => void,
] {
  const [position, setPosition] = React.useState<NavigationBar.NavigationBarPosition | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    NavigationBar.unstable_getPositionAsync().then((position) => {
      if (isMounted) {
        setPosition(position);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setNewPosition = React.useCallback(
    (position: NavigationBar.NavigationBarPosition) => {
      NavigationBar.setPositionAsync(position);
      setPosition(position);
    },
    [setPosition]
  );

  return [position, setNewPosition];
}

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
        <Section title="Background Color">
          <BackgroundColorExample />
        </Section>
        <Section title="Border Color">
          <BorderColorExample />
        </Section>
        <Section title="Position">
          <PositionExample />
        </Section>
        <Section title="Behavior">
          <BehaviorExample />
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

function BackgroundColorExample() {
  return (
    <Button
      onPress={() => NavigationBar.setBackgroundColorAsync(getRandomColor())}
      title="Set background color to random color"
    />
  );
}

function BorderColorExample() {
  return (
    <Button
      onPress={() => NavigationBar.setBorderColorAsync(getRandomColor())}
      title="Set border color to random color"
    />
  );
}

function ButtonStyleExample() {
  const [style, setStyle] = React.useState<NavigationBar.NavigationBarButtonStyle>('light');
  const nextStyle = style === 'light' ? 'dark' : 'light';
  return (
    <Button
      onPress={() => {
        NavigationBar.setButtonStyleAsync(nextStyle);
        setStyle(nextStyle);
      }}
      title={`Toggle bar style: ${nextStyle}`}
    />
  );
}

const NavigationBarBehaviors: NavigationBar.NavigationBarBehavior[] = [
  'inset-swipe',
  'inset-touch',
  'overlay-swipe',
];

function PositionExample() {
  const [position, setPosition] = usePosition();

  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();

  return (
    <>
      <Button
        onPress={() => setPosition(position === 'absolute' ? 'relative' : 'absolute')}
        title={`Position: ${position === 'absolute' ? 'relative' : 'absolute'}`}
      />
      <Text>insets: {JSON.stringify(insets)}</Text>
      <Text>frame: {JSON.stringify(frame)}</Text>
    </>
  );
}

function BehaviorExample() {
  const [behavior, setBehavior] =
    React.useState<NavigationBar.NavigationBarBehavior>('inset-swipe');

  const nextNavigationBarBehavior = React.useMemo(() => {
    const index = NavigationBarBehaviors.indexOf(behavior);
    const newIndex = (index + 1) % NavigationBarBehaviors.length;
    return NavigationBarBehaviors[newIndex];
  }, [behavior]);

  const onPressBehavior = React.useCallback(() => {
    NavigationBar.setBehaviorAsync(nextNavigationBarBehavior);
    setBehavior(nextNavigationBarBehavior);
  }, [nextNavigationBarBehavior]);

  return <Button onPress={onPressBehavior} title={`Behavior: ${nextNavigationBarBehavior}`} />;
}
