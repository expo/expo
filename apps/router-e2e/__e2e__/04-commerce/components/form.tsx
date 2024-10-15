'use client';
import {
  StyleSheet,
  TouchableHighlight,
  View,
  ViewProps,
  TouchableHighlightProps,
} from 'react-native';

import { IconSymbol } from './IconSymbol';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

const Colors = {
  systemGray4: 'rgba(209, 209, 214, 1)',
  secondarySystemGroupedBackground: 'rgba(255, 255, 255, 1)',
  separator: 'rgba(61.2, 61.2, 66, 0.29)',
};

export function FormItem({
  children,
  onPress,
  screen,
  params,
}: Pick<ViewProps, 'children'> &
  Pick<TouchableHighlightProps, 'onPress'> & { screen?: string; params?: Record<string, any> }) {
  let leadingIconChild: React.ReactNode;
  let parsedChildren: React.ReactNode[] = [];
  React.Children.forEach(children, (child, index) => {
    if (!React.isValidElement(child)) return;

    if (child.type === IconSymbol && index === 0) {
      leadingIconChild = React.cloneElement(child, {
        size: 24,
        style: { width: 60, top: 0 },
        ...child.props,
      });
    } else {
      parsedChildren.push(child);
    }
  });

  const navigation = useNavigation();

  return (
    <TouchableHighlight
      style={[{ padding: 12, paddingLeft: !!leadingIconChild ? 0 : 16 }]}
      underlayColor={Colors.systemGray4}
      onPress={
        screen
          ? () => {
              navigation.navigate(screen, params);
            }
          : onPress
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {leadingIconChild}
        {parsedChildren}
      </View>
    </TouchableHighlight>
  );
}
