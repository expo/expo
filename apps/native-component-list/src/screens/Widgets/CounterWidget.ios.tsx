import { Button, Text, VStack } from '@expo/ui/swift-ui';
import { createWidget } from 'expo-widgets';

import { COUNTER_WIDGET_NAME } from './WidgetConstants';
import type { CounterWidgetProps } from './WidgetConstants';

const BareExpoCounterWidget = (props: CounterWidgetProps) => {
  'widget';

  return (
    <VStack alignment="center" spacing={8}>
      <Text>Bare Expo counter</Text>
      <Text>{props.count}</Text>
      <Button label="Increment" target="increment" onPress={() => ({ count: props.count + 1 })} />
    </VStack>
  );
};

export default createWidget(COUNTER_WIDGET_NAME, BareExpoCounterWidget, {
  count: 0,
});
