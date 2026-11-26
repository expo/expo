import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ReanimatedLinkPreview() {
  const [wide, setWide] = useState(false);
  const [moved, setMoved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const width = useSharedValue(120);
  const offset = useSharedValue(0);

  const widthStyle = useAnimatedStyle(() => ({ width: width.value }));
  const offsetStyle = useAnimatedStyle(() => ({ marginLeft: offset.value }));

  return (
    <ScrollView style={{ backgroundColor: '#84DCC6' }} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.container}>
        <Button
          title="Resize"
          onPress={() => {
            setWide(!wide);
            width.value = withTiming(wide ? 120 : 240, { duration: 600 });
          }}
        />
        <Link href="/link-preview/one" asChild>
          <Link.Trigger>
            <Pressable testID="reanimated-width-trigger">
              <Animated.View style={[styles.trigger, widthStyle]}>
                <Text>Animated width</Text>
              </Animated.View>
            </Pressable>
          </Link.Trigger>
          <Link.Preview />
        </Link>

        <Button
          title="Move"
          onPress={() => {
            setMoved(!moved);
            offset.value = withTiming(moved ? 0 : 120, { duration: 600 });
          }}
        />
        <Link href="/link-preview/one" asChild>
          <Link.Trigger>
            <AnimatedPressable testID="reanimated-move-trigger" style={offsetStyle}>
              <View style={styles.trigger}>
                <Text>Animated move</Text>
              </View>
            </AnimatedPressable>
          </Link.Trigger>
          <Link.Preview />
        </Link>

        <Button title="Expand" onPress={() => setExpanded(!expanded)} />
        <Link href="/link-preview/one" asChild>
          <Link.Trigger>
            <AnimatedPressable
              testID="reanimated-layout-trigger"
              layout={LinearTransition.duration(600)}
              style={styles.trigger}>
              <Text>Layout transition</Text>
              {expanded && (
                <Animated.Text entering={FadeIn} exiting={FadeOut}>
                  Extra line
                </Animated.Text>
              )}
            </AnimatedPressable>
          </Link.Trigger>
          <Link.Preview />
        </Link>

        <Text>Zoom (the buttons above also animate these):</Text>
        <Link href="/link-preview/reanimated-zoom-dest" asChild>
          <Link.Trigger withAppleZoom>
            <Pressable testID="reanimated-zoom-width-trigger">
              <Animated.View style={[styles.trigger, widthStyle]}>
                <Text>Zoom width</Text>
              </Animated.View>
            </Pressable>
          </Link.Trigger>
        </Link>
        <Link href="/link-preview/reanimated-zoom-dest" asChild>
          <Link.Trigger withAppleZoom>
            <Pressable testID="reanimated-zoom-move-trigger">
              <Animated.View style={[styles.trigger, offsetStyle]}>
                <Text>Zoom move</Text>
              </Animated.View>
            </Pressable>
          </Link.Trigger>
        </Link>
        <Link href="/link-preview/reanimated-zoom-dest" asChild>
          <Link.Trigger withAppleZoom>
            <AnimatedPressable
              testID="reanimated-zoom-layout-trigger"
              layout={LinearTransition.duration(600)}
              style={styles.trigger}>
              <Text>Zoom layout</Text>
              {expanded && (
                <Animated.Text entering={FadeIn} exiting={FadeOut}>
                  Extra line
                </Animated.Text>
              )}
            </AnimatedPressable>
          </Link.Trigger>
        </Link>
      </View>
    </ScrollView>
  );
}

function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={{ color: '#fff' }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, alignItems: 'flex-start' },
  trigger: { width: 120, padding: 12, backgroundColor: '#fff' },
  button: { padding: 12, backgroundColor: '#3E517A' },
});
