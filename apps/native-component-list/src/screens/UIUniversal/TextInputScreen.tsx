import { Column, Host, ScrollView, Text, TextInput, useNativeState } from '@expo/ui';

export default function TextInputScreen() {
  const name = useNativeState('');

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Controlled (state)</Text>
            <TextInput
              value={name}
              placeholder="Your name"
              onChangeText={(text) => console.log('typed:', text)}
            />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Uncontrolled</Text>
            <TextInput placeholder="Type anything" />
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
