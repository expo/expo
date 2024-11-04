'use server';

import { Text } from 'react-native';

export const greet = async (inputName: string) => `Hello ${inputName} from server!`;

export default function ServerActionsInFile() {
  return <Text>Hey</Text>;
}
