import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import rem from './rem';

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
    fontSize: rem(1.3125),
    marginBottom: rem(1.3125),
    fontWeight: 'bold',
  },
});

export default Section;
