import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CornerRadius() {
  // `?case=<n>` renders a single case, which keeps docs screenshots focused.
  const { case: only } = useLocalSearchParams<{ case?: string }>();
  const show = (n: string) => !only || only === n;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 24, gap: 12 }}
      contentInsetAdjustmentBehavior="automatic">
      {show('1') && (
        <>
          <Text style={styles.label}>1. Radius only on the inner view</Text>
          <Link href="/link-preview/one" asChild>
            <Link.Trigger>
              <Pressable testID="no-radius" style={styles.card}>
                <View style={styles.art} />
                <Text style={styles.caption}>Caption</Text>
              </Pressable>
            </Link.Trigger>
            <Link.Menu>
              <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => {}} />
            </Link.Menu>
          </Link>
        </>
      )}
      {show('2') && (
        <>
          <Text style={styles.label}>2. Background and radius on the Pressable</Text>
          <Link href="/link-preview/one" asChild>
            <Link.Trigger>
              <Pressable testID="background-radius" style={styles.art} />
            </Link.Trigger>
            <Link.Menu>
              <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => {}} />
            </Link.Menu>
          </Link>
        </>
      )}
      {show('3') && (
        <>
          <Text style={styles.label}>3. Radius on the Pressable and the inner view</Text>
          <Link href="/link-preview/one" asChild>
            <Link.Trigger>
              <Pressable testID="nested-radius" style={styles.roundedCard}>
                <View style={styles.art} />
                <Text style={styles.caption}>Caption</Text>
              </Pressable>
            </Link.Trigger>
            <Link.Menu>
              <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => {}} />
            </Link.Menu>
          </Link>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'flex-start' },
  // Link.Trigger with `asChild` rejects style arrays, so this repeats `card`.
  roundedCard: { alignSelf: 'flex-start', borderRadius: 8 },
  label: { fontSize: 15, marginTop: 12 },
  art: { width: 200, height: 120, borderRadius: 8, backgroundColor: '#ff6a00' },
  caption: { marginTop: 8, fontSize: 15 },
});
