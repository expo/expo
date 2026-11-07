import { Link, LinkProps } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useIsMounted } from '@/hooks/useIsMounted';

import { colors, monospaceFontFamily } from './theme';

interface RouteLinksProps {
  children: ReactNode;
}

export function RouteLinks({ children }: RouteLinksProps) {
  const mounted = useIsMounted();
  return (
    <View style={styles.list}>
      {children}
      {/* Lets tests wait for hydration before they click a link. */}
      {mounted && <Text testID="route-links-mounted" />}
    </View>
  );
}

interface RouteLinkProps extends LinkProps {
  children?: ReactNode;
}

export function RouteLink({ children, ...linkProps }: RouteLinkProps) {
  const label = children ?? (typeof linkProps.href === 'string' ? linkProps.href : undefined);
  return (
    <Link {...linkProps} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    alignItems: 'stretch',
    minWidth: 300,
  },
  link: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: monospaceFontFamily,
    textAlign: 'center',
  },
});
