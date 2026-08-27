import { Button, Column, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

import { COUNTER_WIDGET_NAME } from './WidgetConstants';
import type { CounterWidgetProps } from './WidgetConstants';

const BareExpoCounterWidget = (props: CounterWidgetProps) => {
  'widget';

  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={[fillMaxSize(), paddingAll(16)]}>
      <Text>Bare Expo counter</Text>
      <Text>{props.count}</Text>
      <Button
        {...({ target: 'increment' } as { target: string })}
        onClick={() => ({ count: props.count + 1 })}>
        <Text>Increment</Text>
      </Button>
    </Column>
  );
};

export default createWidget(COUNTER_WIDGET_NAME, BareExpoCounterWidget, {
  count: 0,
});
