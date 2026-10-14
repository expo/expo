import { StyleSheet, Text, View } from 'react-native';

export default function AutoTab() {
  return (
    <View style={styles.container}>
      <Text>
        No renderingMode set. Unselected: the dot in its own four colors (no icon color). Selected:
        a purple dot, because selectedColor makes that state a template.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
