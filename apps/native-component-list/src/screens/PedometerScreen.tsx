import { Pedometer } from 'expo-sensors';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

import ListButton from '../components/ListButton';
import { useResolvedValue } from '../utilities/useResolvedValue';
import { H2 } from '@expo/html-elements';

function usePedometer({ isActive }: { isActive: boolean }): Pedometer.PedometerResult | null {
  const [data, setData] = React.useState<Pedometer.PedometerResult | null>(null);
  const listener = React.useRef<Pedometer.PedometerListener | null>(null);

  React.useEffect(() => {
    return () => {
      listener.current?.remove();
    };
  }, []);

  React.useEffect(() => {
    if (isActive) {
      listener.current = Pedometer.watchStepCount(setData);
    } else {
      listener.current?.remove();
    }
  }, [isActive]);

  return data;
}

function usePedometerHistory({
  start,
  end,
}: {
  start: Date;
  end: Date;
}): Pedometer.PedometerResult | null {
  const [data, setData] = React.useState<Pedometer.PedometerResult | null>(null);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    Pedometer.getStepCountAsync(start, end).then(data => {
      if (isMounted.current) {
        setData(data);
      }
    });
  }, [start, end]);

  return data;
}

function StepTrackerView() {
  const [isActive, setActive] = React.useState(false);
  const data = usePedometer({ isActive });
  const message = data?.steps ? `Total steps ${data.steps}` : `Waiting...`;
  return (
    <View style={{ padding: 10 }}>
      <H2>Step Tracker</H2>
      <ListButton onPress={() => setActive(true)} disabled={isActive} title="Start" />
      <ListButton onPress={() => setActive(false)} disabled={!isActive} title="Stop" />
      <Text style={{ paddingTop: 10, fontWeight: 'bold' }}>{message}</Text>
    </View>
  );
}

function StepHistoryMessage() {
  const today = React.useMemo(() => {
    return new Date();
  }, []);
  const yesterday = React.useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    return yesterday;
  }, [today]);

  const data = usePedometerHistory({ start: yesterday, end: today });

  const message = data ? `Steps in the last day: ${data.steps}` : `Loading health data...`;
  return (
    <View style={{ padding: 10 }}>
      <H2>Step History</H2>
      <Text>{message}</Text>
    </View>
  );
}

export default function PedometerScreen() {
  const [value] = useResolvedValue(Pedometer.isAvailableAsync);

  if (value === null) {
    return null;
  } else if (value === false) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Pedometer is not available on this platform</Text>
      </View>
    );
  }
  return (
    <ScrollView>
      <StepTrackerView />
      <StepHistoryMessage />
    </ScrollView>
  );
}

PedometerScreen.navigationOptions = {
  title: 'Pedometer',
};
