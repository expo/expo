import { H2 } from '@expo/html-elements';
import { Pedometer } from 'expo-sensors';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

import ListButton from '../components/ListButton';
import usePermissions from '../utilities/usePermissions';
import { useResolvedValue } from '../utilities/useResolvedValue';

function usePedometer({ isActive }: { isActive: boolean }): Pedometer.PedometerResult | null {
  const [data, setData] = React.useState<Pedometer.PedometerResult | null>(null);
  const listener = React.useRef<Pedometer.Subscription | null>(null);

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
    Pedometer.isRecordingAvailableAsync().then((isRecordingAvailable) => {
      if (!isRecordingAvailable) {
        console.log('Pedometer history is not available on this device.');
        if (isMounted.current) {
          setData({ steps: 0 });
        }
      } else {
        Pedometer.subscribeRecording();
        Pedometer.getStepCountAsync(start, end).then((data) => {
          console.log('Pedometer history data:', data);
          if (isMounted.current) {
            setData(data);
          }
        });
      }
    });
  }, [start, end]);

  return data;
}

function usePedometerEvents() {
  const [lastEvent, setLastEvent] = React.useState<Pedometer.PedometerEvent | null>(null);
  const [isSupported, setIsSupported] = React.useState<boolean | undefined>();
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    let subscription: Pedometer.Subscription | null = null;

    Pedometer.startEventUpdatesAsync()
      .then((available) => {
        if (!isMounted.current) {
          return;
        }
        setIsSupported(available);
        if (!available) {
          return;
        }
        subscription = Pedometer.watchEventUpdates((event) => {
          if (isMounted.current) {
            setLastEvent(event);
          }
        });
      })
      .catch(() => {
        if (isMounted.current) {
          setIsSupported(false);
        }
      });

    return () => {
      isMounted.current = false;
      subscription?.remove();
      Pedometer.stopEventUpdatesAsync().catch(() => {});
    };
  }, []);

  return { lastEvent, isSupported };
}

function StepTrackerView() {
  const [isActive, setActive] = React.useState(false);
  const data = usePedometer({ isActive });
  const { lastEvent, isSupported } = usePedometerEvents();
  const message = data?.steps ? `Total steps ${data.steps}` : `Waiting...`;
  const eventMessage = React.useMemo(() => {
    if (isSupported === undefined) {
      return 'Checking pedometer event support...';
    }
    if (isSupported === false) {
      return 'Pedometer events are not available on this device.';
    }
    if (!lastEvent) {
      return 'Waiting for pedometer events...';
    }
    const date = new Date(lastEvent.date);
    return `Last event: ${lastEvent.type} (${date.toLocaleTimeString()})`;
  }, [isSupported, lastEvent]);
  return (
    <View style={{ padding: 10 }}>
      <H2>Step Tracker</H2>
      <ListButton onPress={() => setActive(true)} disabled={isActive} title="Start" />
      <ListButton onPress={() => setActive(false)} disabled={!isActive} title="Stop" />
      <Text style={{ paddingTop: 10, fontWeight: 'bold' }}>{message}</Text>
      <Text style={{ paddingTop: 10 }}>{eventMessage}</Text>
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

  const isHistoryAvailable = useResolvedValue(Pedometer.isRecordingAvailableAsync);

  const data = usePedometerHistory({ start: yesterday, end: today });

  const message = data ? `Steps in the last day: ${data.steps}` : `Loading health data...`;
  return (
    <View style={{ padding: 10 }}>
      <H2>Step History</H2>
      {isHistoryAvailable === false ? (
        <Text style={{ paddingTop: 10, fontWeight: 'bold' }}>
          Pedometer history is not available on this device.
        </Text>
      ) : null}
      <Text>{message}</Text>
    </View>
  );
}

export default function PedometerGuard() {
  const [isPermissionsGranted] = usePermissions(Pedometer.requestPermissionsAsync);
  const [isAvailable] = useResolvedValue(Pedometer.isAvailableAsync);

  if (isAvailable === null) {
    return null;
  }

  if (!isPermissionsGranted || !isAvailable) {
    // this can also occur if the device doesn't have a pedometer
    const message = isAvailable
      ? 'You have not granted permission to use the device motion on this device!'
      : 'Your device does not have a pedometer';
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' }}>
        <Text>{message}</Text>
      </View>
    );
  }
  return <PedometerScreen />;
}

function PedometerScreen() {
  return (
    <ScrollView>
      <StepTrackerView />
      <StepHistoryMessage />
    </ScrollView>
  );
}

PedometerGuard.navigationOptions = {
  title: 'Pedometer',
};
