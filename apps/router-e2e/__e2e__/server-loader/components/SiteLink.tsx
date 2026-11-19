import { Link, LinkProps } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface SiteLinksProps {
  children: ReactNode;
}

export function SiteLinks({ children }: SiteLinksProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <View style={styles.linksContainer}>
      {children}
      {/* Lets tests wait for hydration before they click a link. */}
      {mounted && <Text testID="site-links-mounted" />}
    </View>
  );
}

interface SiteLinkProps extends LinkProps {
  children: ReactNode;
}

export function SiteLink({ children, ...linkProps }: SiteLinkProps) {
  return (
    <Link {...linkProps} style={styles.link}>
      <Text style={styles.linkText}>{children}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  linksContainer: {
    gap: 12,
    alignItems: 'center',
  },
  link: {
    backgroundColor: '#202425',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#313538',
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
