import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

const HeaderContainerRight = (props: PropsWithChildren<ViewProps>) => (
  <View {...props} style={[styles.container, props.style]} />
);

const styles = StyleSheet.create({
  container: {
    paddingRight: 8,
    flexDirection: 'row',
  },
});

export default HeaderContainerRight;
