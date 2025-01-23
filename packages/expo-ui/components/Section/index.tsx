import * as React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type SectionProps = {
  style?: StyleProp<ViewStyle>;
  title: string;
  children: any;
};

function OutlinedCard(props: { children: React.ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 12,
        margin: 12,
        paddingVertical: 24,
        borderColor: '#CAC4D0',
        backgroundColor: '#F7F2FA',
        borderWidth: 1,
      }}>
      {props.children}
    </View>
  );
}

export function Section({ title, children }: { title: string; children: any }) {
  return (
    <OutlinedCard>
      <Text style={{ fontSize: 30, fontWeight: 'bold', paddingHorizontal: 20 }}>{title}</Text>

      {children.map((c, idx) => (
        <>
          <View
            key={idx}
            style={{
              minHeight: 50,
              paddingHorizontal: 20,
              justifyContent: 'center',
            }}>
            {c}
          </View>
          {idx !== children.length - 1 && (
            <View
              key={'separator' + idx}
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: 'lightgray',
                marginHorizontal: 20,
              }}
            />
          )}
        </>
      ))}
    </OutlinedCard>
  );
}
