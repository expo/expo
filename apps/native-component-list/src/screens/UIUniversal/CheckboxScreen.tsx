import { Host, Column, Text, Checkbox, ScrollView } from '@expo/ui';
import { useState } from 'react';

export default function CheckboxScreen() {
  const [terms, setTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [updates, setUpdates] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Basic</Text>
            <Checkbox value={terms} onValueChange={setTerms} label="Accept terms" />
            <Checkbox
              value={newsletter}
              onValueChange={setNewsletter}
              label="Subscribe to newsletter"
            />
            <Checkbox value={updates} onValueChange={setUpdates} label="Receive updates" />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Without label</Text>
            <Checkbox value={terms} onValueChange={setTerms} />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Disabled</Text>
            <Checkbox value onValueChange={() => {}} label="Locked on" disabled />
            <Checkbox value={false} onValueChange={() => {}} label="Locked off" disabled />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>State</Text>
            <Text>{`Terms: ${terms ? 'accepted' : 'not accepted'}`}</Text>
            <Text>{`Newsletter: ${newsletter ? 'subscribed' : 'not subscribed'}`}</Text>
            <Text>{`Updates: ${updates ? 'enabled' : 'disabled'}`}</Text>
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

CheckboxScreen.navigationOptions = {
  title: 'Checkbox',
};
