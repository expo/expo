import { reloadAppAsync } from 'expo';
import { ScrollView, StyleSheet } from 'react-native';

import ListButton from '../../components/ListButton';

export default function ExpoCoreModuleScreen() {
  return (
    <ScrollView style={styles.scrollView}>
      <ListButton
        title="reloadAppAsync"
        onPress={() => {
          reloadAppAsync('Reload from ExpoCoreModuleScreen');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 10,
  },
});
