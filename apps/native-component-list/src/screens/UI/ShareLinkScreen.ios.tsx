import { ShareLink, LabelPrimitive } from '@expo/ui/swift-ui';
import { useAssets } from 'expo-asset';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function ShareLinkScreen() {
  const [assets] = useAssets([require('../../../assets/images/example1.jpg')]);

  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Default">
          <ShareLink item="https://docs.expo.dev/versions/latest/sdk/ui/" />
        </Section>
        <Section title="With Subject and Message">
          <ShareLink
            item="https://docs.expo.dev/versions/latest/sdk/ui/"
            subject="Expo UI"
            message="A set of components that allow you to build UIs directly with SwiftUI and Jetpack Compose from React."
          />
        </Section>
        <Section title="With Custom Label">
          <ShareLink item="https://docs.expo.dev/versions/latest/sdk/ui/">
            <LabelPrimitive title="Expo UI" systemImage="swift" />
          </ShareLink>
        </Section>
        <Section title="With Preview Image">
          <ShareLink
            item="https://docs.expo.dev/versions/latest/sdk/ui/"
            preview={{
              title: 'Expo Splash Screen Logo',
              image: 'SplashScreenLogo',
            }}>
            <LabelPrimitive title="Expo Splash Screen Logo" />
          </ShareLink>
        </Section>
        <Section title="Share Image">
          <ShareLink
            item={assets?.[0].localUri ?? ''}
            subject="Share Image Example"
            message="A set of components that allow you to build UIs directly with SwiftUI and Jetpack Compose from React.">
            <LabelPrimitive title="Share Image" systemImage="photo" />
          </ShareLink>
        </Section>
        <Section title="With children">
          <ShareLink
            item="https://docs.expo.dev/versions/latest/sdk/ui/"
            subject="Expo UI"
            message="A set of components that allow you to build UIs directly with SwiftUI and Jetpack Compose from React.">
            <View style={styles.row}>
              <Image
                src="https://raw.githubusercontent.com/expo/expo/main/.github/resources/banner.png"
                width={24}
                height={24}
              />
              <Text style={styles.link}>Expo Logo</Text>
            </View>
          </ShareLink>
        </Section>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  link: {
    fontSize: 21,
    color: 'blue',
  },
});
