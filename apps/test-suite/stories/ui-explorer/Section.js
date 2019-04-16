/* eslint-disable react/prop-types */

/**
 * @flow
 */

import AppText from './AppText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const SectionTitle = ({ children }) => (
  <AppText accessibilityRole="heading" aria-level="2" style={styles.sectionTitle}>
    {children}
  </AppText>
);

const Section = ({ children, title }) => (
  <View>
    <SectionTitle>{title}</SectionTitle>
    {children}
  </View>
);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: '1.3125rem',
    marginBottom: '1.3125rem',
    fontWeight: 'bold'
  }
});

export default Section;
