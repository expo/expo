import { Link, usePathname, type Href } from 'expo-router';
import { useTheme } from 'expo-router/react-navigation';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function DemoScreen({ title, children }: { title: string; children?: ReactNode }) {
  const pathname = usePathname();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={['left', 'right']} style={styles.content}>
        <View>
          <Text testID="e2e-screen" style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          <Text testID="e2e-pathname" style={styles.pathname}>
            {pathname}
          </Text>
        </View>
        {children}
      </SafeAreaView>
    </ScrollView>
  );
}

export function DemoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type DemoButtonProps = {
  title: string;
  testID?: string;
} & ({ href: Href; withAnchor?: boolean; onPress?: never } | { onPress: () => void; href?: never });

export function DemoButton({ title, testID, ...props }: DemoButtonProps) {
  const button = (
    <Pressable
      testID={props.href ? undefined : testID}
      onPress={props.onPress}
      style={styles.button}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );

  if (props.href) {
    return (
      <Link testID={testID} href={props.href} withAnchor={props.withAnchor} asChild>
        {button}
      </Link>
    );
  }
  return button;
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pathname: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    gap: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
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
