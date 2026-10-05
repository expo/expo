import * as Hinge from 'expo-hinge';
import * as React from 'react';
import { ScrollView } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

export default function HingeScreen() {
  const hinge = Hinge.useHinge();
  const [events, setEvents] = React.useState<string[]>([]);

  React.useEffect(() => {
    const subscription = Hinge.addHingeListener((event) => {
      setEvents((previous) => [JSON.stringify(event.hinge), ...previous].slice(0, 10));
    });
    return () => subscription.remove();
  }, []);

  return (
    <ScrollView style={{ padding: 10 }}>
      <HeadingText>useHinge()</HeadingText>
      <MonoText>{JSON.stringify(hinge, null, 2)}</MonoText>
      <HeadingText>Sync API</HeadingText>
      <MonoText>
        {JSON.stringify({ isAvailable: Hinge.isAvailable(), getHinge: Hinge.getHinge() }, null, 2)}
      </MonoText>
      <HeadingText>addHingeListener() events, latest first</HeadingText>
      <MonoText>{events.length ? events.join('\n') : 'Fold the device to see events.'}</MonoText>
    </ScrollView>
  );
}

HingeScreen.navigationOptions = {
  title: 'Hinge',
};
