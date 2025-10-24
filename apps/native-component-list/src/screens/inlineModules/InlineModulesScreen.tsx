import { useState } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';

import SimpleModule from './inlineModulesExamples/SimpleModule.module';
import TestView from './inlineModulesExamples/TestView.view';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

export default function InlineModulesScreen() {
  const [inlineModuleConstant] = useState(
    Platform.OS === 'android' ? 'Kotlin constant 7610' : 'Swift constant 1283'
  );

  return (
    <Page>
      <View style={styles.moduleContainer}>
        <HeadingText>Inline module</HeadingText>
        <Text>
          In the inline module there is a 'test' constant set to "{inlineModuleConstant}".
        </Text>
        <MonoText>
          {`Constant("test") {
  return "${inlineModuleConstant}"
}`}
        </MonoText>
        <Text>Below you should see this constant accessed from the module </Text>
        <MonoText>{SimpleModule.test}</MonoText>
      </View>
      <HeadingText> Inline view </HeadingText>
      <Text>
        Below you should see an inline view - expo web view showing Expo Modules API docs.
      </Text>
      <TestView style={styles.viewContainer} url="https://docs.expo.dev/modules/" />
    </Page>
  );
}

const styles = StyleSheet.create({
  moduleContainer: {
    flex: 1,
    minHeight: '30%',
    overflow: 'hidden',
  },
  viewContainer: {
    flex: 1,
    minHeight: '70%',
    overflow: 'hidden',
  },
});
