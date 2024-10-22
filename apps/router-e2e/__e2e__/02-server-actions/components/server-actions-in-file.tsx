'use server';

import { unstable_headers } from 'expo-router/rsc/headers';
import { Text } from 'react-native';

export const greet = async (inputName: string) => `Hello ${inputName} from server!`;

export const greetWithHeaders = async () => {
  const headers = await unstable_headers();

  return <Text testID="server-action-headers">headers:{headers.get('expo-platform')}</Text>;
};
