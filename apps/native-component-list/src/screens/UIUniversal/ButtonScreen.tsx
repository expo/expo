import { Host, Column, Text, Button, ScrollView } from '@expo/ui';
import { useState } from 'react';

export default function ButtonScreen() {
  const [count, setCount] = useState(0);
  const [lastVariant, setLastVariant] = useState('None');

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Variants</Text>
            <Button label="Filled" variant="filled" onPress={() => setLastVariant('filled')} />
            <Button
              label="Outlined"
              variant="outlined"
              onPress={() => setLastVariant('outlined')}
            />
            <Button label="Text" variant="text" onPress={() => setLastVariant('text')} />
            <Text>{`Last variant pressed: ${lastVariant}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Counter</Text>
            <Button
              label={`Pressed ${count} times`}
              variant="filled"
              onPress={() => setCount((c) => c + 1)}
            />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Disabled</Text>
            <Button label="Disabled filled" variant="filled" disabled onPress={() => {}} />
            <Button label="Disabled outlined" variant="outlined" disabled onPress={() => {}} />
            <Button label="Disabled text" variant="text" disabled onPress={() => {}} />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Styled</Text>
            <Button
              label="Custom style"
              variant="filled"
              style={{ borderRadius: 20, opacity: 0.8 }}
              onPress={() => {}}
            />
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

ButtonScreen.navigationOptions = {
  title: 'Button',
};
