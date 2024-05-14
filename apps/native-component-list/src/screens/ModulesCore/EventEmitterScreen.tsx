import { ScrollView, StyleSheet } from 'react-native';

import ListButton from '../../components/ListButton';

export default function EventEmitterScreen() {
  return (
    <ScrollView style={styles.scrollView}>
      <ListButton title="reloadAppAsync" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 10,
  },
});
