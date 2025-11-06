import { Image } from 'expo-image';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">Explore</ThemedText>
            <ThemedText style={styles.centerText} themeColor="textSecondary">
              This starter app includes example{'\n'}code to help you get started.
            </ThemedText>

            <ExternalLink href="https://docs.expo.dev" asChild>
              <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.linkButton}>
                  <ThemedText type="link">Expo documentation</ThemedText>
                  <IconSymbol color={theme.text} name="arrow.up.right.square" size={12} />
                </ThemedView>
              </Pressable>
            </ExternalLink>
          </ThemedView>

          <ThemedView style={styles.sectionsWrapper}>
            <Collapsible title="File-based routing">
              <ThemedText type="small">
                This app has two screens: <ThemedText type="code">app/(tabs)/index.tsx</ThemedText>{' '}
                and <ThemedText type="code">app/(tabs)/explore.tsx</ThemedText>
              </ThemedText>
              <ThemedText type="small">
                The layout file in <ThemedText type="code">app/(tabs)/_layout.tsx</ThemedText> sets
                up the tab navigator.
              </ThemedText>
              <ExternalLink href="https://docs.expo.dev/router/introduction">
                <ThemedText type="linkPrimary">Learn more</ThemedText>
              </ExternalLink>
            </Collapsible>

            <Collapsible title="Android, iOS, and web support">
              <ThemedView type="backgroundElement" style={styles.collapsibleContent}>
                <ThemedText type="small">
                  You can open this project on Android, iOS, and the web. To open the web version,
                  press <ThemedText type="smallBold">w</ThemedText> in the terminal running this
                  project.
                </ThemedText>
                <Image
                  source={require('@/assets/images/tutorial-web.png')}
                  style={styles.imageTutorial}
                />
              </ThemedView>
            </Collapsible>

            <Collapsible title="Images">
              <ThemedText type="small">
                For static images, you can use the <ThemedText type="code">@2x</ThemedText> and{' '}
                <ThemedText type="code">@3x</ThemedText> suffixes to provide files for different
                screen densities.
              </ThemedText>
              <Image source={require('@/assets/images/react-logo.png')} style={styles.imageReact} />
              <ExternalLink href="https://reactnative.dev/docs/images">
                <ThemedText type="linkPrimary">Learn more</ThemedText>
              </ExternalLink>
            </Collapsible>

            <Collapsible title="Light and dark mode components">
              <ThemedText type="small">
                This template has light and dark mode support. The{' '}
                <ThemedText type="code">useColorScheme()</ThemedText> hook lets you inspect what the
                user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
              </ThemedText>
              <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
                <ThemedText type="linkPrimary">Learn more</ThemedText>
              </ExternalLink>
            </Collapsible>

            <Collapsible title="Animations">
              <ThemedText type="small">
                This template includes an example of an animated component. The{' '}
                <ThemedText type="code">components/ui/collapsible.tsx</ThemedText> component uses
                the powerful <ThemedText type="code">react-native-reanimated</ThemedText> library to
                animate opening this hint.
              </ThemedText>
            </Collapsible>
          </ThemedView>
          {Platform.OS === 'web' && <WebBadge />}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});
