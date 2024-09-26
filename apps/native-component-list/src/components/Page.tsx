import { H4 } from '@expo/html-elements';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

export function Page({ children }: PropsWithChildren) {
  return <View style={styles.page}>{children}</View>;
}

const ScrollPage = ({ children }: PropsWithChildren) => (
  <ScrollView style={[styles.page, styles.scrollPage]}>{children}</ScrollView>
);

type SectionProps = PropsWithChildren<{ title: string; row?: boolean }>;

const Section = ({ title, children, row }: SectionProps) => (
  <View style={styles.section}>
    <H4 style={styles.sectionHeader}>{title}</H4>
    <View style={{ flexDirection: row ? 'row' : 'column' }}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  scrollPage: {
    flex: 1,
  },
  section: {
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  sectionHeader: {
    marginTop: 8,
  },
});

export { ScrollPage, Section };
