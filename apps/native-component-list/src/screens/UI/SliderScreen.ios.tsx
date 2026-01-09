import { Button, Form, Host, Section, Slider, Text } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

export default function SliderScreen() {
  const [basicValue, setBasicValue] = React.useState(0.5);
  const [rangeValue, setRangeValue] = React.useState(50);
  const [stepValue, setStepValue] = React.useState(0.5);
  const [rangeStepValue, setRangeStepValue] = React.useState(25);
  const [labelValue, setLabelValue] = React.useState(0.5);
  const [fullValue, setFullValue] = React.useState(50);
  const [isEditing, setIsEditing] = React.useState(false);
  const [controlledValue, setControlledValue] = React.useState(50);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Basic Slider">
          <Text>Value: {basicValue}</Text>
          <Slider value={basicValue} onValueChange={setBasicValue} />
        </Section>

        <Section title="With Min/Max Range (0-100)">
          <Text>Value: {rangeValue}</Text>
          <Slider value={rangeValue} min={0} max={100} onValueChange={setRangeValue} />
        </Section>

        <Section title="With Step Only (0.25)">
          <Text>Value: {stepValue}</Text>
          <Slider value={stepValue} step={0.25} onValueChange={setStepValue} />
        </Section>

        <Section title="With Min/Max (0-100) and Step (25)">
          <Text>Value: {rangeStepValue}</Text>
          <Slider
            value={rangeStepValue}
            min={0}
            max={100}
            step={25}
            onValueChange={setRangeStepValue}
          />
        </Section>

        <Section title="With Labels">
          <Text>Value: {labelValue.toFixed(2)}</Text>
          <Slider
            value={labelValue}
            onValueChange={setLabelValue}
            label={<Text>Volume</Text>}
            minimumValueLabel={<Text>0</Text>}
            maximumValueLabel={<Text>1</Text>}
          />
        </Section>

        <Section title="Full Example (All Props)">
          <Text>
            Value: {fullValue.toFixed(0)} {isEditing ? '(editing)' : ''}
          </Text>
          <Slider
            value={fullValue}
            min={0}
            max={100}
            step={10}
            onValueChange={setFullValue}
            onEditingChanged={setIsEditing}
            label={<Text>Brightness</Text>}
            minimumValueLabel={<Text>0%</Text>}
            maximumValueLabel={<Text>100%</Text>}
          />
        </Section>

        <Section title="Controlled State">
          <Text>Value: {controlledValue}</Text>
          <Slider
            value={controlledValue}
            min={0}
            max={100}
            step={10}
            onValueChange={setControlledValue}
          />
          <Button
            onPress={() => setControlledValue((v) => Math.max(0, v - 10))}
            label="Decrement"
          />
          <Button
            onPress={() => setControlledValue((v) => Math.min(100, v + 10))}
            label="Increment"
          />
        </Section>
        <Section title="Red color Slider">
          <Slider modifiers={[tint('red')]} />
        </Section>
      </Form>
    </Host>
  );
}

SliderScreen.navigationOptions = {
  title: 'Slider',
};
