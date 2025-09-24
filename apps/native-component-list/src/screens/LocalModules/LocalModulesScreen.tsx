import { Text } from 'react-native';

import SimpleModule from './localModulesExamples/SimpleModule.module';
import TestView from './localModulesExamples/TestView.view';

export default function LocalModulesScreen() {
  return (
    <>
      <Text>{SimpleModule.test}</Text>
      <TestView style={{ flex: 1 }} url="https://docs.expo.dev/modules/" />
    </>
  );
}
