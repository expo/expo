import type { Widget } from 'expo-widgets';

import type { CounterWidgetProps } from './WidgetConstants';

const unsupportedWidget = {
  reload() {},
  updateSnapshot(_props: CounterWidgetProps) {},
} as Widget<CounterWidgetProps>;

export default unsupportedWidget;
