import { Column, Picker, Row, ScrollView, Spacer, Text } from '@expo/ui';
import { useState } from 'react';

const FLAVOURS = [
  { label: 'Vanilla', value: 'vanilla' as const },
  { label: 'Chocolate', value: 'chocolate' as const },
  { label: 'Strawberry', value: 'strawberry' as const },
  { label: 'Pistachio', value: 'pistachio' as const },
];

type Flavour = (typeof FLAVOURS)[number]['value'];

const SIZES = [
  { label: 'Small', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'Large', value: 3 },
];

export default function PickerScreen() {
  const [menuFlavour, setMenuFlavour] = useState<Flavour>('vanilla');
  const [wheelFlavour, setWheelFlavour] = useState<Flavour>('chocolate');
  const [size, setSize] = useState(2);
  const [disabledFlavour, setDisabledFlavour] = useState<Flavour>('strawberry');

  return (
    <ScrollView style={{ padding: 16 }}>
      <Column spacing={24}>
        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Menu appearance (default)</Text>
          <Row alignment="center" spacing={12}>
            <Text>Flavour:</Text>
            <Spacer flexible />
            <Picker selectedValue={menuFlavour} onValueChange={setMenuFlavour}>
              {FLAVOURS.map((f) => (
                <Picker.Item key={f.value} label={f.label} value={f.value} />
              ))}
            </Picker>
          </Row>
          <Text>{`Selected: ${menuFlavour}`}</Text>
        </Column>

        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Wheel appearance</Text>
          <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
            Renders as an inline scrollable rotor on iOS; Android falls back to the menu UI
            (Material 3 has no wheel picker).
          </Text>
          <Picker selectedValue={wheelFlavour} onValueChange={setWheelFlavour} appearance="wheel">
            {FLAVOURS.map((f) => (
              <Picker.Item key={f.value} label={f.label} value={f.value} />
            ))}
          </Picker>
          <Text>{`Selected: ${wheelFlavour}`}</Text>
        </Column>

        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Numeric values</Text>
          <Row alignment="center" spacing={12}>
            <Text>Size:</Text>
            <Spacer flexible />
            <Picker selectedValue={size} onValueChange={setSize}>
              {SIZES.map((s) => (
                <Picker.Item key={s.value} label={s.label} value={s.value} />
              ))}
            </Picker>
          </Row>
          <Text>{`Selected: ${size}`}</Text>
        </Column>

        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Disabled</Text>
          <Row alignment="center" spacing={12}>
            <Text>Flavour:</Text>
            <Spacer flexible />
            <Picker
              selectedValue={disabledFlavour}
              onValueChange={setDisabledFlavour}
              enabled={false}>
              {FLAVOURS.map((f) => (
                <Picker.Item key={f.value} label={f.label} value={f.value} />
              ))}
            </Picker>
          </Row>
        </Column>
      </Column>
    </ScrollView>
  );
}

PickerScreen.navigationOptions = {
  title: 'Picker',
};
