import * as ExpoBrownfield from 'expo-brownfield';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Header } from '@/components';
import { useEffect } from 'react';

type CounterState = {
  count: number;
};

const State = () => {
  const [counterState, setCounter] = ExpoBrownfield.useSharedState<CounterState>('counter');
  const [time, _setTime] = ExpoBrownfield.useSharedState('time');

  useEffect(() => {
    setCounter({ count: 0 });
  }, []);

  return (
    <SafeAreaView>
      <Header title="Shared State" />
      <Text>Counter: {counterState?.count}</Text>
      <ActionButton
        title="+"
        description=""
        icon="plus"
        onPress={() => setCounter({ count: counterState?.count + 1 })}
        testID="navigation-pop-to-native"
      />
      <ActionButton
        title="-"
        description=""
        icon="minus"
        onPress={() => setCounter({ count: counterState?.count - 1 })}
        testID="navigation-pop-to-native"
      />
      <Text>Time: {time?.time ?? 'No time'}</Text>
    </SafeAreaView>
  );
};

export default State;
