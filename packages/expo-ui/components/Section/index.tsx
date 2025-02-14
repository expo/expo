import * as React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type SectionProps = {
  style?: StyleProp<ViewStyle>;
  title: string;
  /**
   *  Option to display the title in lower case letters
   * @default true
   */
  displayTitleUppercase?: boolean;
  children: React.ReactNode;
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

export function Section(props: SectionProps) {
  return (
    <OutlinedCard>
      <Text style={{ fontSize: 30, fontWeight: 'bold', paddingHorizontal: 20 }}>{props.title}</Text>

      {React.Children.map(props.children, (c, idx) => (
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
          {idx !== React.Children.count(props.children) - 1 && (
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
