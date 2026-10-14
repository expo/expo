import { StyleSheet, Text, View } from 'react-native';

export default function SymbolTab() {
  return (
    <View style={styles.container}>
      <Text>
        SF Symbol (iOS). Unselected: monochrome cloud.sun outline. Selected: multicolor
        cloud.sun.fill with a yellow sun. Android shows the tinted md cloud icon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
