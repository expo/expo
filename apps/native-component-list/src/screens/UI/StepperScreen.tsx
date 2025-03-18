import { Button } from '@expo/ui/components/Button';
import { Section } from '@expo/ui/components/Section';
import { Stepper } from '@expo/ui/components/Stepper';
import * as React from 'react';

import { Page } from '../../components/Page';

export default function StepperScreen() {
  const [value, setValue] = React.useState(0);
  return (
    <Page>
      <Section title="Stepper" style={{ height: 200 }}>
        <Stepper
          label={`Value: ${value.toFixed(1)}`}
          min={-10}
          max={10}
          step={1}
          value={value}
          onValueChange={(value) => {
            setValue(value);
          }}
        />
        <Button
          onPress={() => {
            setValue(0);
          }}>
          Reset
        </Button>
      </Section>
    </Page>
  );
}

StepperScreen.navigationOptions = {
  title: 'Stepper',
};
