import { StyleSheet, View, ViewProps } from 'react-native';
import React from 'react';

const Colors = {
  systemGray4: 'rgba(209, 209, 214, 1)',
  secondarySystemGroupedBackground: 'rgba(255, 255, 255, 1)',
  separator: 'rgba(61.2, 61.2, 66, 0.29)',
};

export function FormList({ children, ...props }: ViewProps) {
  const childrenWithSeparator = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      const isLastChild = index === React.Children.count(children) - 1;
      return (
        <>
          {child}
          {!isLastChild && <Separator />}
        </>
      );
    }
    return child;
  });

  return (
    <View
      {...props}
      style={[
        {
          borderCurve: 'continuous',
          overflow: 'hidden',
          borderRadius: 10,

          backgroundColor: Colors.secondarySystemGroupedBackground,
        },
        props.style,
      ]}
      children={childrenWithSeparator}
    />
  );
}

function Separator() {
  return (
    <View
      style={{
        marginStart: 60,
        borderBottomWidth: 0.5, //StyleSheet.hairlineWidth,
        marginTop: -0.5, // -StyleSheet.hairlineWidth,
        borderBottomColor: Colors.separator,
      }}
    />
  );
}
