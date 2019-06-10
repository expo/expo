import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Label } from './DocItem';
import AppText from './AppText';
import ExternalLink from './ExternalLink';
import insertBetween from './insertBetween';
import rem from './rem';

const Title = ({ children }) => (
  <AppText accessibilityRole="heading" style={styles.title}>
    {children}
  </AppText>
);

export const Description = ({ children }) => (
  <AppText style={styles.description}>
    {insertBetween(
      () => (
        <Divider key={Math.random()} />
      ),
      React.Children.toArray(children)
    )}
  </AppText>
);

const Divider = () => <View style={styles.divider} />;

const SourceLink = ({ uri }) => (
  <ExternalLink
    href={`https://github.com/expo/expo/tree/master/apps/storybook/stories/${uri}`}
    style={styles.link}>
    Edit this page on GitHub
  </ExternalLink>
);

const IssuesLink = ({ label }) => (
  <ExternalLink href={`https://github.com/expo/expo/labels/${label}`} style={styles.link}>
    View open issues for {label}
  </ExternalLink>
);

// TODO: Bacon: Add Canny button https://expo.canny.io/
const UIExplorer = ({ children, packageName, description, sections, title, url, label }) => (
  <View style={styles.root}>
    <Title>{title}</Title>
    {packageName && (
      <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
        <Label
          accessibilityRole="link"
          target="_blank"
          href={`https://npmjs.com/package/${packageName}`}>
          {packageName}
        </Label>
      </View>
    )}
    {description && <Description>{description}</Description>}
    {children}
    {url && <SourceLink uri={url} />}
    {label && <IssuesLink label={label} />}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexBasis: 'auto',
  },
  divider: {
    height: rem(1.3125),
  },
  title: {
    fontSize: rem(2),
  },
  description: {
    color: '#666',
    display: 'flex',
    flexDirection: 'column',
    fontSize: rem(1.25),
    marginTop: rem(0.5 * 1.3125),
    marginBottom: rem(1.5 * 1.3125),
  },
  link: {
    color: '#1B95E0',
    fontSize: rem(1),
    marginTop: rem(0.5 * 1.3125),
    textDecorationLine: 'underline',
  },
});

export default UIExplorer;
