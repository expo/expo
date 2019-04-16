/* eslint-disable react/prop-types */

/**
 * @flow
 */

import AppText from './AppText';
import ExternalLink from './ExternalLink';
import insertBetween from './insertBetween';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const Title = ({ children }) => (
  <AppText accessibilityRole="heading" style={styles.title}>
    {children}
  </AppText>
);

export const Description = ({ children }) => (
  <AppText style={styles.description}>
    {insertBetween(() => <Divider key={Math.random()} />, React.Children.toArray(children))}
  </AppText>
);

const Divider = () => <View style={styles.divider} />;

const SourceLink = ({ uri }) => (
  <ExternalLink
    href={`https://github.com/necolas/react-native-web/tree/master/packages/website/storybook/${uri}`}
    style={styles.link}
  >
    View source code on GitHub
  </ExternalLink>
);

const UIExplorer = ({ children, description, sections, title, url }) => (
  <View style={styles.root}>
    <Title>{title}</Title>
    {description}
    {children}
    {url && <SourceLink uri={url} />}
  </View>
);

const styles = StyleSheet.create({
  root: {
    padding: '1rem',
    flex: 1,
    flexBasis: 'auto'
  },
  divider: {
    height: '1.3125rem'
  },
  title: {
    fontSize: '2rem'
  },
  description: {
    color: '#666',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '1.25rem',
    marginTop: 'calc(0.5 * 1.3125rem)',
    marginBottom: 'calc(1.5 * 1.3125rem)'
  },
  link: {
    color: '#1B95E0',
    fontSize: '1rem',
    marginTop: 'calc(0.5 * 1.3125rem)',
    textDecorationLine: 'underline'
  }
});

export default UIExplorer;
