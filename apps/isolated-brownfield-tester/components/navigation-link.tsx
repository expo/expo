import { type Href, Link } from 'expo-router';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

type Props =
  | {
      href: Href;
      onPress?: undefined;
      subtitle?: string;
      title: string;
    }
  | {
      href?: undefined;
      onPress: () => void;
      subtitle?: string;
      title: string;
    };

export function NavigationLink({ href, onPress, subtitle, title }: Props) {
  if (!href) {
    return (
      <Pressable onPress={onPress}>
        <ThemedView style={styles.container}>
          <View style={styles.textContainer}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <ThemedText type="defaultSemiBold">{subtitle ?? ''}</ThemedText>
          </View>
          <IconSymbol color="#9CA3AF" name="chevron.right" size={36} />
        </ThemedView>
      </Pressable>
    );
  }

  return (
    <Link href={href}>
      <Link.Trigger>
        <ThemedView style={styles.container}>
          <View style={styles.textContainer}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <ThemedText type="defaultSemiBold">{subtitle ?? ''}</ThemedText>
          </View>
          <IconSymbol color="#9CA3AF" name="chevron.right" size={36} />
        </ThemedView>
      </Link.Trigger>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
    width: '100%',
  },
  textContainer: {
    gap: 8,
    maxWidth: '80%',
  },
});
