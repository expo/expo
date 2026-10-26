import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

export default function Detail() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Stack.Title>Google Photos</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          accessibilityLabel="Expand"
          icon="arrow.up.left.and.arrow.down.right"
          onPress={() => {}}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Reply"
          icon="arrowshape.turn.up.left"
          onPress={() => {}}
        />
        <Stack.Toolbar.Button
          accessibilityLabel="Reply all"
          icon="arrowshape.turn.up.left.2"
          onPress={() => {}}
        />
        <Stack.Toolbar.Button
          accessibilityLabel="Forward"
          icon="arrowshape.turn.up.right"
          onPress={() => {}}
        />
        <Stack.Toolbar.Button
          accessibilityLabel="Archive"
          icon="archivebox"
          onPress={() => {}}
        />
        <Stack.Toolbar.Button accessibilityLabel="Move" icon="folder" onPress={() => {}} />
        <Stack.Toolbar.Button
          accessibilityLabel="Search"
          icon="magnifyingglass"
          onPress={() => {}}
        />
      </Stack.Toolbar>
      <Text>Nested Expo Router Stack</Text>
      <Text>headerShown: false</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24 },
});
