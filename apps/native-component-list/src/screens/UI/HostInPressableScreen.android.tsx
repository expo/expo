import { Button, Host, Switch, Text as ExpoUIText, TextInput } from '@expo/ui';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch as ReactNativeSwitch,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Repro for https://github.com/expo/expo/issues/52066.
function useCounter() {
  const [count, setCount] = useState(0);
  return [count, () => setCount((previous) => previous + 1)] as const;
}

export default function HostInPressableScreen() {
  const [insideButton, pressInsideButton] = useCounter();
  const [insidePressable, pressInsidePressable] = useCounter();
  const [besideButton, pressBesideButton] = useCounter();
  const [besidePressable, pressBesidePressable] = useCounter();
  const [switchPressable, pressSwitchPressable] = useCounter();
  const [isExpoUISwitchOn, setIsExpoUISwitchOn] = useState(false);
  const [isReactNativeSwitchOn, setIsReactNativeSwitchOn] = useState(false);
  const [focusCount, countFocus] = useCounter();
  const [textPressable, pressTextPressable] = useCounter();
  const [scrolledUnderHost, setScrolledUnderHost] = useState(false);

  return (
    // A scroll that starts on a control still scrolls the screen.
    <ScrollView testID="screen" contentContainerStyle={styles.screen}>
      <Text style={styles.title}>1. Button inside a Pressable</Text>
      <Pressable testID="inside-pressable" onPress={pressInsidePressable} style={styles.card}>
        <Host matchContents testID="inside-button">
          <Button label="Press me" onPress={pressInsideButton} />
        </Host>
      </Pressable>
      <Text testID="inside-counts">{`inside: button ${insideButton}, pressable ${insidePressable}`}</Text>

      <Text style={styles.title}>2. Button beside a Pressable</Text>
      <View style={styles.card}>
        <Pressable onPress={pressBesidePressable} style={StyleSheet.absoluteFill} />
        <Host matchContents testID="beside-button">
          <Button label="Press me" onPress={pressBesideButton} />
        </Host>
      </View>
      <Text testID="beside-counts">{`beside: button ${besideButton}, pressable ${besidePressable}`}</Text>

      <Text style={styles.title}>3. Switch inside a Pressable</Text>
      <Pressable onPress={pressSwitchPressable} style={styles.card}>
        <Host matchContents testID="expo-ui-switch">
          <Switch value={isExpoUISwitchOn} onValueChange={setIsExpoUISwitchOn} />
        </Host>
      </Pressable>
      <Text testID="switch-counts">{`switch: ${isExpoUISwitchOn ? 'on' : 'off'}, pressable ${switchPressable}`}</Text>

      <Text style={styles.title}>4. React Native Switch inside a Pressable</Text>
      <Pressable style={styles.card}>
        <ReactNativeSwitch
          testID="react-native-switch"
          value={isReactNativeSwitchOn}
          onValueChange={setIsReactNativeSwitchOn}
        />
      </Pressable>
      <Text>{`react native switch: ${isReactNativeSwitchOn ? 'on' : 'off'}`}</Text>

      <Text style={styles.title}>5. TextInput inside a Pressable</Text>
      <Pressable style={styles.card}>
        <Host matchContents={{ vertical: true }} style={styles.field} testID="text-input">
          <TextInput placeholder="Tap to type" onFocus={countFocus} />
        </Host>
      </Pressable>
      <Text testID="focus-counts">{`focused: ${focusCount}`}</Text>

      <Text style={styles.title}>6. Text inside a Pressable</Text>
      <Pressable onPress={pressTextPressable} style={styles.card}>
        <Host matchContents testID="expo-ui-text">
          <ExpoUIText>Not a control</ExpoUIText>
        </Host>
      </Pressable>
      <Text testID="text-counts">{`text: pressable ${textPressable}`}</Text>

      <Text style={styles.title}>7. Text Host over a ScrollView</Text>
      <View style={styles.overlayArea}>
        <ScrollView
          horizontal
          onScroll={(event) => setScrolledUnderHost(event.nativeEvent.contentOffset.x > 0)}
          scrollEventThrottle={16}>
          <View style={styles.wideContent} />
        </ScrollView>
        {/* A touch on content that isn't a control falls through to the scroll view. */}
        <Host style={StyleSheet.absoluteFill} testID="overlay-host">
          <ExpoUIText>Swipe me</ExpoUIText>
        </Host>
      </View>
      <Text testID="overlay-counts">{`overlay: ${scrolledUnderHost ? 'scrolled' : 'not scrolled'}`}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 800, gap: 6 },
  title: { fontWeight: 'bold', marginTop: 10 },
  card: {
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
  },
  field: { alignSelf: 'stretch' },
  overlayArea: { height: 80, borderWidth: 1, borderColor: '#999' },
  wideContent: { width: 2000, height: 80, backgroundColor: '#dde' },
});
