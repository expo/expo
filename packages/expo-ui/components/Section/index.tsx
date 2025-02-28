import * as React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type SectionProps = {
 /**
  * @note On iOS, section titles are usually capitalized for consistency with platform conventions.
  */
  title: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

function OutlinedCard(props: { children: React.ReactNode, style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[{
        borderRadius: 12,
        margin: 12,
        paddingVertical: 24,
        borderColor: '#CAC4D0',
        backgroundColor: '#F7F2FA',
        borderWidth: 1,
      }, props.style]}>
      {props.children}
    </View>
  );
}


export function Section({ title, children, style }: SectionProps) {
  return (
    <OutlinedCard style={style}>
      <Text style={{ fontSize: 30, fontWeight: 'bold', paddingHorizontal: 20 }}>{title}</Text>

      {React.Children.map(children, (c, idx) => (
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
          {idx !== React.Children.count(children) - 1 && (
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
