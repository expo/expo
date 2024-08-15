import 'server-only';
import { View, Image, Text, Button } from '../lib/react-native';

// import { openai } from '@ai-sdk/openai';
// import { generateText } from 'ai';
import { ActionButton } from '../lib/action-button';
// import { streamUI } from 'ai/rsc';

// const model = openai('gpt-4o');

import { AI } from '../lib/ai-actions';
export default function Page() {
  return (
    <AI>
      <View style={{ flex: 1, gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <Text testID="main-text">Hey RSC</Text>
        {/* local Metro asset */}
        <Image
          testID="main-image"
          source={require('../../../assets/icon.png')}
          style={{ width: 100, height: 100 }}
        />

        <ActionButton title="Button" />
      </View>
    </AI>
  );
}
