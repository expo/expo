import { Host, Column, Text, Switch, ScrollView } from '@expo/ui';
import { useState } from 'react';

export default function SwitchScreen() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [airplane, setAirplane] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Basic</Text>
            <Switch value={wifi} onValueChange={setWifi} label="Wi-Fi" />
            <Switch value={bluetooth} onValueChange={setBluetooth} label="Bluetooth" />
            <Switch value={airplane} onValueChange={setAirplane} label="Airplane Mode" />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Without label</Text>
            <Switch value={wifi} onValueChange={setWifi} />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Disabled</Text>
            <Switch value onValueChange={() => {}} label="Locked on" disabled />
            <Switch value={false} onValueChange={() => {}} label="Locked off" disabled />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>State</Text>
            <Text>{`Wi-Fi: ${wifi ? 'on' : 'off'}`}</Text>
            <Text>{`Bluetooth: ${bluetooth ? 'on' : 'off'}`}</Text>
            <Text>{`Airplane: ${airplane ? 'on' : 'off'}`}</Text>
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

SwitchScreen.navigationOptions = {
  title: 'Switch',
};
