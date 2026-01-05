import { Button, Host, List, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { labelsHidden, tint, toggleStyle } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function ToggleScreen() {
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [buttonStyleOn, setButtonStyleOn] = useState(true);
  const [vibrateOnRing, setVibrateOnRing] = useState(false);
  const [controlled, setControlled] = useState(false);
  const [lastValue, setLastValue] = useState<boolean | null>(null);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="With System Image">
          <Toggle
            isOn={airplaneMode}
            onIsOnChange={setAirplaneMode}
            label="Airplane Mode"
            systemImage="airplane"
          />
        </Section>
        <Section title="Button Style">
          <Toggle
            isOn={buttonStyleOn}
            onIsOnChange={setButtonStyleOn}
            label="Button Toggle"
            modifiers={[toggleStyle('button'), tint('#ff9500')]}
          />
        </Section>
        <Section title="Custom Label">
          <Toggle isOn={vibrateOnRing} onIsOnChange={setVibrateOnRing}>
            <Text>Vibrate on Ring</Text>
            <Text>Enable vibration when the phone rings</Text>
          </Toggle>
        </Section>
        <Section title="Controlled State">
          <Toggle isOn={controlled} onIsOnChange={setControlled} label="Controlled Toggle" />
          <Button label="Turn On" onPress={() => setControlled(true)} />
          <Button label="Turn Off" onPress={() => setControlled(false)} />
        </Section>
        <Section title="Uncontrolled">
          <Toggle onIsOnChange={setLastValue} label="Uncontrolled Toggle" />
          <Text>Last value: {lastValue === null ? '' : String(lastValue)}</Text>
        </Section>
        <Section title="Hidden Label">
          <Toggle label="Hidden Label" modifiers={[labelsHidden()]} />
        </Section>
      </List>
    </Host>
  );
}
