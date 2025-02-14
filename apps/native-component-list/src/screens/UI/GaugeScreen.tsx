
import { Gauge } from '@expo/ui/components/Gauge';

import * as React from 'react';

export default function GaugeScreen() {
  return (
    <>
      <Gauge
        minValue={1}
        valueExtension="°C"
        maxValue={30}
        currentValue={12}
        gaugeStyle="accessoryCircularCapacity"
      />
      <Gauge
        minValue={1}
        valueExtension="°C"
        maxValue={30}
        currentValue={12}
        gaugeStyle="accessoryCircular"
      />
      <Gauge minValue={1} valueExtension="°C" maxValue={30} currentValue={12} gaugeStyle="linear" />
      <Gauge
        minValue={1}
        valueExtension="°C"
        maxValue={30}
        currentValue={12}
        gaugeStyle="accessoryLinear"
      />
    </>
  );
}

GaugeScreen.navigationOptions = {
  title: 'Gauge',
};
