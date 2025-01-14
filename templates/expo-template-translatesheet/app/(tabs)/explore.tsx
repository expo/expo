import { StyleSheet, Image, Platform } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TranslateSheet from "translate-sheet";

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{translations.exploreTitle}</ThemedText>
      </ThemedView>
      <ThemedText>{translations.introduction}</ThemedText>

      <Collapsible title={translations.routingTitle}>
        <ThemedText>
          {translations.routingScreens}{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          and{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          {translations.routingLayout}{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{" "}
          {translations.routingSetsUp}
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">{translations.routingLearnMore}</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title={translations.platformTitle}>
        <ThemedText>
          {translations.platformDescription}{" "}
          <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal
          running this project.
        </ThemedText>
      </Collapsible>

      <Collapsible title={translations.imagesTitle}>
        <ThemedText>
          {translations.imagesDescription}{" "}
          <ThemedText type="defaultSemiBold">@2x</ThemedText>{" "}
          {translations.imagesAnd}{" "}
          <ThemedText type="defaultSemiBold">@3x</ThemedText>{" "}
          {translations.imagesSuffixes}
        </ThemedText>
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={{ alignSelf: "center" }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">{translations.routingLearnMore}</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title={translations.fontsTitle}>
        <ThemedText>
          {translations.fontsDescription}{" "}
          <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText>{" "}
          {translations.fontsLoad}{" "}
          <ThemedText style={{ fontFamily: "SpaceMono" }}>
            {translations.fontsExample}
          </ThemedText>
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <ThemedText type="link">{translations.routingLearnMore}</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title={translations.themeTitle}>
        <ThemedText>
          {translations.themeDescription}{" "}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText>{" "}
          {translations.themeInspect}
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">{translations.routingLearnMore}</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title={translations.animationsTitle}>
        <ThemedText>
          {translations.animationsDescription}{" "}
          <ThemedText type="defaultSemiBold">
            components/HelloWave.tsx
          </ThemedText>{" "}
          {translations.animationsUses}{" "}
          <ThemedText type="defaultSemiBold">
            react-native-reanimated
          </ThemedText>{" "}
          {translations.animationsLib}
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The{" "}
              <ThemedText type="defaultSemiBold">
                components/ParallaxScrollView.tsx
              </ThemedText>{" "}
              {translations.animationsParallax}
            </ThemedText>
          ),
        })}
      </Collapsible>
      <Collapsible title={translations.translateTitle}>
        <ThemedText>
          {translations.translateDescription} {translations.translateInline}{" "}
          <ThemedText type="defaultSemiBold">
            TranslateSheet.create()
          </ThemedText>
          .
        </ThemedText>
        <ThemedText>
          {translations.translateCli}{" "}
          <ThemedText type="defaultSemiBold">
            bun translate-sheet generate
          </ThemedText>{" "}
          {translations.translateGenerate}
        </ThemedText>
        <ExternalLink href="https://www.translatesheet.co/">
          <ThemedText type="link">{translations.translateLearnMore}</ThemedText>
        </ExternalLink>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const translations = TranslateSheet.create("TabTwoScreen", {
  exploreTitle: "Explore",
  introduction: "This app includes example code to help you get started.",

  routingTitle: "File-based routing",
  routingScreens: "This app has two screens:",
  routingLayout: "The layout file in",
  routingSetsUp: "sets up the tab navigator.",
  routingLearnMore: "Learn more",

  platformTitle: "Android, iOS, and web support",
  platformDescription:
    "You can open this project on Android, iOS, and the web. To open the web version, press",

  imagesTitle: "Images",
  imagesDescription: "For static images, you can use the",
  imagesAnd: "and",
  imagesSuffixes: "suffixes to provide files for different screen densities",

  fontsTitle: "Custom fonts",
  fontsDescription: "Open",
  fontsLoad: "to see how to load",
  fontsExample: "custom fonts such as this one.",

  themeTitle: "Light and dark mode components",
  themeDescription: "This template has light and dark mode support. The",
  themeInspect:
    "hook lets you inspect what the user's current color scheme is, and so you can adjust UI colors accordingly.",

  animationsTitle: "Animations",
  animationsDescription:
    "This template includes an example of an animated component. The",
  animationsUses: "component uses the powerful",
  animationsLib: "library to create a waving hand animation.",
  animationsParallax:
    "component provides a parallax effect for the header image.",

  translateTitle: "Translation and localization",
  translateDescription: "This app uses TranslateSheet to manage translations.",
  translateInline: "Translations are defined inline with components using",
  translateCli: "Run",
  translateGenerate: "to generate translation files.",
  translateSwitch:
    "The app supports dynamic language switching without app reload.",
  translateLearnMore: "Learn more",
});

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
