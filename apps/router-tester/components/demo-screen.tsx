import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, usePathname, type Href } from 'expo-router';
import type { StackHeaderProps } from 'expo-router/js-stack';
import { getHeaderTitle, Header, HeaderBackground, useTheme } from 'expo-router/react-navigation';
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

export function JSHeaderTitle({ children }: { children: string }) {
  return (
    <View style={styles.headerTitle}>
      <Text style={styles.headerTitleText}>{children}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>JS</Text>
      </View>
    </View>
  );
}

// A JS Stack header with extra space below the title row.
export function JSHeader({ back, layout, options, route }: StackHeaderProps) {
  return (
    <View style={styles.header}>
      <HeaderBackground style={StyleSheet.absoluteFill} />
      <Header
        {...options}
        back={back}
        layout={layout}
        modal={options.presentation === 'modal'}
        title={getHeaderTitle(options, route.name)}
        headerShadowVisible={false}
      />
    </View>
  );
}

export function JSHeaderBackButton({ canGoBack }: { canGoBack?: boolean }) {
  if (!canGoBack) {
    return null;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => router.back()}
      style={styles.backButton}>
      <Ionicons name="chevron-back" size={20} color="#3a3a3c" />
    </Pressable>
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
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '600',
  },
  header: {
    paddingBottom: 8,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 8,
  },
  badge: {
    backgroundColor: '#e5e5ea',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#636366',
  },
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
