import { Link, Stack, usePathname, useRouter, type Href } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeIndex = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.log(
      'globalThis.expo.router',
      globalThis.expo?.router?.currentPathname,
      globalThis.expo?.router?.currentParams
    );
  }, []);

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={['left', 'right']} style={styles.content}>
        <Stack.Screen
          options={{ headerShown: true, title: 'Router Tester', headerLargeTitle: true }}
        />
        <Text style={styles.subtitle}>Current Path: {pathname}</Text>
        <Section title="Native navigation">
          <CaseLink href="/tabs" text="Native Tabs" />
          <CaseLink href="/tabs-form-sheet/home" text="Native Tabs Form Sheet" />
          <CaseLink href="/link-preview" text="Link Preview" />
          <CaseLink href="/split-view" text="Split View" replace />
          <CaseLink href="/split-view-mail" text="Split View Mail" replace />
          <CaseLink href="/split-view-navigation" text="Split View Navigation" replace />
          <CaseLink href="/toolbar" text="Toolbar" />
          <CaseLink href="/header-items" text="Header Items" />
        </Section>
        <Section title="Composition">
          <CaseLink href="/composition-lifecycle" text="Composition Lifecycle" />
          <CaseLink href="/composition-conflicts" text="Composition Conflicts" />
          <CaseLink href="/composition-rerenders" text="Composition Rerenders" />
        </Section>
        <Section title="Modals">
          <CaseLink href="/modals" text="Modals" />
        </Section>
        <Section title="Linking + Behavior">
          <CaseLink href="/params" text="Params" />
          <CaseLink href="/suspense" text="Suspense" />
          <CaseLink href="/can-go-back" text="Can Go Back" />
        </Section>
        <Section title="JavaScript navigators">
          <CaseLink href="/js-stack" text="JS Stack" />
          <CaseLink href="/js-tabs" text="JS Tabs" />
          <CaseLink href="/custom-tabs" text="Custom Tabs" />
          <CaseLink href="/top-tabs" text="JS Top Tabs" />
        </Section>
        <Section title="Stack behavior">
          <CaseLink href="/experimental-stack" text="Experimental Stack" />
          <CaseLink href="/navigation-aware-activity" text="Navigation Aware Activity" />
        </Section>
        <Section title="Drawers">
          <CaseLink href="/drawer" text="Drawer" />
          <CaseLink href="/drawer-open" text="Drawer (default open)" />
        </Section>
        <Section title="Errors">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Error boundaries"
            onPress={() => router.push('/error-boundaries')}
            style={styles.button}>
            <Text style={styles.buttonText}>Error boundaries</Text>
          </Pressable>
        </Section>
      </SafeAreaView>
    </ScrollView>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function CaseLink({ href, text, replace }: { href: Href; text: string; replace?: boolean }) {
  const button = (
    <Pressable accessibilityRole="button" accessibilityLabel={text} style={styles.button}>
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
  // A preview loads the route into the root Stack, and Link does not support a preview with `replace`.
  if (replace) {
    return (
      <Link href={href} replace asChild>
        {button}
      </Link>
    );
  }
  return (
    <Link href={href} asChild>
      <Link.Trigger>{button}</Link.Trigger>
      <Link.Preview />
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 0,
    gap: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: 'rgb(11, 103, 175)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
});

export default HomeIndex;
