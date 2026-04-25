import { Host, Column, Text, Slider, ScrollView } from '@expo/ui';
import { useState } from 'react';

export default function SliderScreen() {
  const [basic, setBasic] = useState(0.5);
  const [ranged, setRanged] = useState(50);
  const [stepped, setStepped] = useState(20);

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Basic (0–1)</Text>
            <Slider value={basic} onValueChange={setBasic} />
            <Text>{`Value: ${basic.toFixed(2)}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Custom range (0–100)</Text>
            <Slider value={ranged} onValueChange={setRanged} min={0} max={100} />
            <Text>{`Value: ${ranged.toFixed(0)}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Stepped (step=20, 0–100)</Text>
            <Slider value={stepped} onValueChange={setStepped} min={0} max={100} step={20} />
            <Text>{`Value: ${stepped}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Disabled</Text>
            <Slider value={0.3} onValueChange={() => {}} disabled />
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

SliderScreen.navigationOptions = {
  title: 'Slider',
};
