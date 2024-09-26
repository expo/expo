import { useScrollToTop } from '@react-navigation/native';
import React, { PropsWithChildren, useRef } from 'react';
import { ScrollViewProps, ScrollView as RNScrollView, Platform } from 'react-native';
import {
  NativeViewGestureHandlerProps,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';

type StyledScrollViewProps = PropsWithChildren<
  ScrollViewProps &
    NativeViewGestureHandlerProps & {
      lightBackgroundColor?: string;
      darkBackgroundColor?: string;
    }
>;

export default function NavigationScrollView({ style, ...otherProps }: StyledScrollViewProps) {
  const ref = useRef(null);

  useScrollToTop(ref);

  const ScrollView = Platform.OS === 'android' ? RNScrollView : RNGHScrollView;

  return <ScrollView style={style} {...otherProps} ref={ref} />;
}
