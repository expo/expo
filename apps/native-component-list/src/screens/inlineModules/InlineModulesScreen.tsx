import { requireNativeModule, requireNativeView } from 'expo';
import { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';
import { BodyText } from '../../components/BodyText';

const SimpleModule = requireNativeModule('SimpleModule');
const TestView = requireNativeView('TestView');

export default function InlineModulesScreen() {
  const [inlineModuleConstant] = useState(
    Platform.OS === 'android' ? 'Kotlin constant 7610' : 'Swift constant 1283'
  );

  return (
    <Page>
      <View style={styles.moduleContainer}>
        <HeadingText>Inline module</HeadingText>
        <BodyText>
          In the inline module there is a 'test' constant set to "{inlineModuleConstant}".
        </BodyText>
        <MonoText>
          {`Constant("test") {
  return "${inlineModuleConstant}"
}`}
        </MonoText>
        <BodyText>Below you should see this constant accessed from the module </BodyText>
        <MonoText>{SimpleModule.test}</MonoText>
      </View>
      <HeadingText> Inline view </HeadingText>
      <BodyText>
        Below you should see an inline view - expo web view showing Expo Modules API docs.
      </BodyText>
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
