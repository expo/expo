import { reloadAppAsync } from 'expo';
import { ScrollView, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import ListButton from '../../components/ListButton';
import MonoText from '../../components/MonoText';

export default function ExpoCoreModuleScreen() {
  return (
    <ScrollView style={styles.scrollView}>
      <ListButton
        title="reloadAppAsync"
        onPress={() => {
          reloadAppAsync('Reload from ExpoCoreModuleScreen');
        }}
      />

      <HeadingText>expoModulesCoreVersion</HeadingText>
      <MonoText>{JSON.stringify(globalThis.expo.expoModulesCoreVersion, null, 2)}</MonoText>
      <HeadingText>cacheDir</HeadingText>
      <MonoText>{globalThis.expo.cacheDir}</MonoText>
      <HeadingText>documentsDir</HeadingText>
      <MonoText>{globalThis.expo.documentsDir}</MonoText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 10,
  },
});
