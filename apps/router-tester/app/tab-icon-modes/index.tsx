import { StyleSheet, Text, View } from 'react-native';

export default function ImageTab() {
  return (
    <View style={styles.container}>
      <Text>
        Image icon. Unselected: a single-color tinted dot. Selected: the dot in its own four colors.
        iOS uses renderingMode, Android uses tinting.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
