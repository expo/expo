import { Gauge, Host, List, Section, Text, Button } from '@expo/ui/swift-ui';
import { gaugeStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function GaugeScreen() {
  const [value, setValue] = useState(0.5);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Basic">
          <Gauge value={value} />
          <Button
            onPress={() => {
              if (value >= 1) {
                setValue(0);
              } else {
                setValue(value + 0.5);
              }
            }}
            label={value >= 1 ? 'Reset' : 'Increase progress'}></Button>
        </Section>
        <Section title="With Labels">
          <Gauge
            value={50}
            min={0}
            max={100}
            currentValueLabel={<Text>50%</Text>}
            minimumValueLabel={<Text>0</Text>}
            maximumValueLabel={<Text>100</Text>}>
            <Text>Usage</Text>
          </Gauge>
        </Section>
        <Section title="Circular Styles">
          <Gauge value={value} modifiers={[gaugeStyle('circular')]}>
            <Text>Circular</Text>
          </Gauge>
          <Gauge value={value} modifiers={[gaugeStyle('circularCapacity')]}>
            <Text>Capacity</Text>
          </Gauge>
        </Section>
        <Section title="Linear Styles">
          <Gauge value={value} modifiers={[gaugeStyle('linear')]}>
            <Text>Linear</Text>
          </Gauge>
          <Gauge value={value} modifiers={[gaugeStyle('linearCapacity')]}>
            <Text>Capacity</Text>
          </Gauge>
        </Section>
        <Section title="With Tint">
          <Gauge value={value} modifiers={[gaugeStyle('circular'), tint('green')]} />
          <Gauge value={value} modifiers={[gaugeStyle('linear'), tint('red')]} />
        </Section>
      </List>
    </Host>
  );
}

GaugeScreen.navigationOptions = {
  title: 'Gauge',
};
