import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Detail() {
  return (
    <View style={styles.content}>
      <Link href="/split-view-toolbar-gap/detail" asChild>
        <Pressable>
          <Text>Push detail route</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24 },
});
