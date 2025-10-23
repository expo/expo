import { Text } from 'react-native';

import SimpleModule from './inlineModulesExamples/SimpleModule.module';
import TestView from './inlineModulesExamples/TestView.view';

export default function InlineModulesScreen() {
  return (
    <>
      <Text>{SimpleModule.test}</Text>
      <TestView style={{ flex: 1 }} url="https://docs.expo.dev/modules/" />
    </>
  );
}
