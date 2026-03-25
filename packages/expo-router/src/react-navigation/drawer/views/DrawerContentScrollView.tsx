'use client';
import * as React from 'react';
import { use } from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '../../native';
import { DrawerPositionContext } from '../utils/DrawerPositionContext';

type Props = ScrollViewProps & {
  ref?: React.Ref<ScrollView>;
  children: React.ReactNode;
};

const SPACING = 12;

function DrawerContentScrollViewInner({
  ref,
  contentContainerStyle,
  style,
  children,
  ...rest
}: Props) {
  const drawerPosition = use(DrawerPositionContext);
  const insets = useSafeAreaInsets();
  const { direction } = useLocale();

  const isRight = direction === 'rtl' ? drawerPosition === 'left' : drawerPosition === 'right';

  return (
    <ScrollView
      {...rest}
      ref={ref}
      contentContainerStyle={[
        {
          paddingTop: SPACING + insets.top,
          paddingBottom: SPACING + insets.bottom,
          paddingStart: SPACING + (!isRight ? insets.left : 0),
          paddingEnd: SPACING + (isRight ? insets.right : 0),
        },
        contentContainerStyle,
      ]}
      style={[styles.container, style]}>
      {children}
    </ScrollView>
  );
}

export const DrawerContentScrollView = DrawerContentScrollViewInner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
