import React from "react";
import { Image, StyleSheet, Platform } from "react-native";
import TranslateSheet from "translate-sheet";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import LocationToggle from "@/components/LocationToggle";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          {translations.headerTitle({ name: "Expo" })}
        </ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">{translations.step1Title}</ThemedText>
        <ThemedText>
          {translations.step1EditText}{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          {translations.step1PressChanges}{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          {translations.step1DevTools}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">{translations.step2Title}</ThemedText>
        <ThemedText>{translations.step2Description}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">{translations.step3Title}</ThemedText>
        <ThemedText>
          {translations.step3RunCommand}{" "}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
          {translations.step3FreshApp}
          <ThemedText type="defaultSemiBold">
            {translations.step3AppText}
          </ThemedText>{" "}
          {translations.step3MoveDir}{" "}
          <ThemedText type="defaultSemiBold">
            {translations.step3AppText}
          </ThemedText>{" "}
          {translations.step3To}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
      <LocationToggle />
    </ParallaxScrollView>
  );
}

const translations = TranslateSheet.create("HomeScreen", {
  headerTitle: "Welcome! {{name}}",
  step1Title: "Step 1: Try it",
  step1EditText: "Edit",
  step1PressChanges: "to see changes. Press",
  step1DevTools: "to open developer tools.",
  step2Title: "Step 2: Explore",
  step2Description:
    "Tap the Explore tab to learn more about what's included in this starter app.",
  step3Title: "Step 3: Get a fresh start",
  step3RunCommand: "When you're ready, run",
  step3FreshApp: "to get a fresh ",
  step3AppText: "app",
  step3To: "to",
  step3MoveDir: "directory. This will move the current",
  languageSelect: "Select Language",
});

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  languageToggleContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  languagePicker: {
    height: 50,
    width: "100%",
  },
});
