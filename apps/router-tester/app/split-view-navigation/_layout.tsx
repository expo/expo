import {
  Link,
  router,
  useCanGoBack,
  useGlobalSearchParams,
  useNavigation,
  useSegments,
} from 'expo-router';
import {
  CommonActions,
  type NavigationProp,
  type ParamListBase,
} from 'expo-router/react-navigation';
import { SplitView, useSplitView, type SplitViewColumnName } from 'expo-router/unstable-split-view';
import { useState } from 'react';
import { Button, PlatformColor, ScrollView, StyleSheet, Text, View } from 'react-native';

const CATEGORIES: Record<string, string[]> = {
  all: ['GitHub', 'Google', 'Home Wi-Fi', 'Office Wi-Fi'],
  wifi: ['Home Wi-Fi', 'Office Wi-Fi'],
  passkeys: ['GitHub', 'Google'],
};

export default function Layout() {
  const segments = useSegments();
  // A launch URL below the demo root starts on the content column.
  const [initialColumn] = useState<SplitViewColumnName>(() =>
    segments.length > 1 ? 'secondary' : 'primary'
  );
  return (
    <SplitView topColumnForCollapsing={initialColumn} preferredDisplayMode="twoBesideSecondary">
      <SplitView.Column header={{ title: 'Categories' }}>
        <Categories />
      </SplitView.Column>
      <SplitView.Column header={{ title: 'Entries' }}>
        <Entries />
      </SplitView.Column>
      <SplitView.Content header={{ title: 'Entry' }} />
    </SplitView>
  );
}

function Categories() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { show, isCollapsed, compactColumn } = useSplitView();
  const canGoBack = useCanGoBack();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.list}>
      {Object.keys(CATEGORIES).map((category) => (
        <Link
          key={category}
          testID={`split-view-navigation-category-${category}`}
          href={`/split-view-navigation/${category}`}
          splitViewColumnName="supplementary"
          style={styles.link}>
          {category}
        </Link>
      ))}
      <Link
        testID="split-view-navigation-settings"
        href="/split-view-navigation/settings"
        splitViewColumnName="secondary"
        style={styles.link}>
        Settings (nested Stack)
      </Link>
      <View style={styles.controls}>
        <Text style={styles.sectionTitle}>Test cases</Text>
        <Text testID="split-view-navigation-state">
          isCollapsed: {String(isCollapsed)}, compactColumn: {String(compactColumn)}
        </Text>
        <Text testID="split-view-navigation-can-go-back">useCanGoBack: {String(canGoBack)}</Text>
        <Button title="show('supplementary')" onPress={() => show('supplementary')} />
        <Button title="show('secondary')" onPress={() => show('secondary')} />
        <Button
          title="push /all/GitHub with secondary"
          onPress={() =>
            router.push('/split-view-navigation/all/GitHub', { splitViewColumnName: 'secondary' })
          }
        />
        <Button
          title="replace /wifi with supplementary"
          onPress={() =>
            router.replace('/split-view-navigation/wifi', {
              splitViewColumnName: 'supplementary',
            })
          }
        />
        <Button title="router.back()" onPress={() => router.back()} />
        {/* A reset removes the SplitView routes from the root history, so the root layout uses a Stack again. */}
        <Button
          title="Back to home"
          onPress={() =>
            navigation.dispatch(
              CommonActions.reset({
                ...navigation.getState(),
                index: 0,
                routes: [{ name: 'index' }],
              })
            )
          }
        />
      </View>
    </ScrollView>
  );
}

function Entries() {
  const { category = 'all' } = useGlobalSearchParams<{ category?: string }>();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.list}>
      {(CATEGORIES[category] ?? []).map((entry) => (
        <Link
          key={entry}
          href={{
            pathname: '/split-view-navigation/[category]/[entry]',
            params: { category, entry },
          }}
          splitViewColumnName="secondary"
          style={styles.link}>
          {entry}
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, gap: 4 },
  link: { fontSize: 17, color: PlatformColor('link'), paddingVertical: 8 },
  controls: { paddingTop: 20, gap: 4 },
  sectionTitle: { fontSize: 13, color: 'gray', textTransform: 'uppercase' },
});
