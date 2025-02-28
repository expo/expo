import { Binding, StringBinding } from '@expo/ui/src/binding';
import * as React from 'react';
import { Text } from 'react-native';

import { Page, Section } from '../../components/Page';
import { Button } from '@expo/ui/components/Button';
import { TextInput } from '@expo/ui/components/TextInput';
import { useEventListener } from 'expo';

function useBinding<T, X>(binding: Binding<T>, computed: (bindingValue: T) => X) {
  const [state, setState] = React.useState(computed(binding.get()));
  const listener = React.useCallback(({ newValue }: { newValue: T }) => {
    setState(computed(newValue));
  }, []);
  useEventListener(binding, 'onBindingValueChanged', listener);
  return state;
}

export default function BindingScreen() {
  const name = React.useMemo(() => StringBinding('123'), ['4']);
  const rerenderCount = React.useRef(0);
  rerenderCount.current += 1;
  const result = useBinding(name, (v) => v.length > 5);
  return (
    <Page>
      <Section title="Current value">
        <Text>{JSON.stringify({ result, rerenderCount: rerenderCount.current })}</Text>
        <Button
          onPress={() => {
            console.log('Submit form', JSON.stringify({ name }));
          }}>
          Submit
        </Button>
        <Button
          onPress={() => {
            console.log(name.get());
          }}>
          get
        </Button>
        <Button
          onPress={() => {
            name.set(Math.random().toString());
          }}>
          set
        </Button>
        <TextInput value={name} style={{ height: 80, width: 300 }} />
        <TextInput value={name} style={{ height: 80, width: 300 }} />
        <TextInput value={name} style={{ height: 80, width: 300 }} />
        <TextInput value={name} style={{ height: 80, width: 300 }} />
      </Section>
    </Page>
  );
}

BindingScreen.navigationOptions = {
  title: 'TextInput',
};
