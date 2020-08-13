import { H4 } from '@expo/html-elements';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

export function Page({ children }: { children: any }) {
  return <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>{children}</View>;
}

export function Section({ title, children, row }: { title: string; children: any; row?: boolean }) {
  return (
    <View
      style={{
        borderBottomColor: 'rgba(0,0,0,0.1)',
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingBottom: 8,
      }}>
      <H4 style={{ marginTop: 8 }}>{title}</H4>
      <View style={{ flexDirection: row ? 'row' : 'column' }}>{children}</View>
    </View>
  );
}
