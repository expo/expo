'use server';

import { View, Text } from '../lib/react-native';

export async function renderNativeViews(name: string) {
  return (
    <View style={{ borderWidth: 1, padding: 4, margin: 4, gap: 8 }}>
      <View>
        <Text style={{}}>Server Action</Text>
        <Text>[Env] Platform = {process.env.EXPO_OS}</Text>
        <Text>[Param] name = {name}</Text>
      </View>
      <Text style={{ color: 'darkcyan' }}>
        Hello {name} from {process.env.EXPO_OS} Expo Router server!
      </Text>
      <Text>More native! views from the server</Text>
      {/* <TextInput
        style={{
          height: 40,
          margin: 12,
          borderWidth: 1,
          padding: 10,
        }}
        placeholder="useless placeholder"
      /> */}
      {/* <Switch trackColor={{ false: '#767577', true: '#81b0ff' }} ios_backgroundColor="#3e3e3e" /> */}
    </View>
  );
}
