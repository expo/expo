import { Text, View, StyleSheet } from "react-native";
import { Link, LinkProps } from 'expo-router';
import { ReactNode } from "react";

interface SiteLinksProps {
  children: ReactNode;
}

export function SiteLinks({ children }: SiteLinksProps) {
  return (
    <View style={styles.linksContainer}>
      {children}
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