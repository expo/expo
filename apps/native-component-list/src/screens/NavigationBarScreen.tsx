import * as NavigationBar from 'expo-navigation-bar';
import * as React from 'react';

import Button from '../components/Button';
import { Page, Section } from '../components/Page';
import { getRandomColor } from '../utilities/getRandomColor';

function usePosition(): [
  NavigationBar.Position | null,
  (position: NavigationBar.Position) => void
] {
  const [position, setPosition] = React.useState<NavigationBar.Position | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    NavigationBar.getPositionAsync().then((position) => {
      if (isMounted) {
        setPosition(position);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setNewPosition = React.useCallback(
    (position: NavigationBar.Position) => {
      NavigationBar.setPositionAsync(position);
      setPosition(position);
    },
    [setPosition]
  );

  return [position, setNewPosition];
}

export default function NavigationBarScreen() {
  return (
    <Page>
      <Section title="Visibility">
        <VisibilityExample />
      </Section>
      <Section title="Appearance">
        <AppearanceExample />
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

function AppearanceExample() {
  const [style, setStyle] = React.useState<NavigationBar.Appearance>('light');
  const nextStyle = style === 'light' ? 'dark' : 'light';
  return (
    <Button
      onPress={() => {
        NavigationBar.setAppearanceAsync(nextStyle);
        setStyle(nextStyle);
      }}
      title={`Toggle appearance: ${nextStyle}`}
    />
  );
}

const NavigationBarBehaviors: NavigationBar.Behavior[] = [
  'inset-swipe',
  'inset-touch',
  'overlay-swipe',
];

function PositionExample() {
  const [position, setPosition] = usePosition();

  return (
    <Button
      onPress={() => setPosition(position === 'absolute' ? 'relative' : 'absolute')}
      title={`Position: ${position === 'absolute' ? 'relative' : 'absolute'}`}
    />
  );
}

function BehaviorExample() {
  const [behavior, setBehavior] = React.useState<NavigationBar.Behavior>('inset-swipe');

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
