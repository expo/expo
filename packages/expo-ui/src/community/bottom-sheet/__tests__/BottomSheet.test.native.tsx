import { render } from '@testing-library/react-native';
import { isValidElement, type ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { findNativeViewProps } from '../../../__mocks__/expo';
import { BottomSheet } from '../BottomSheet';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

// The view `RNHostView` hosts: its first descendant that is a React Native `View`.
function hostedViewStyle() {
  let node: ReactNode = findNativeViewProps('RNHostView')?.children;
  while (isValidElement(node) && node.type !== View) {
    node = (node.props as { children?: ReactNode }).children;
  }
  return isValidElement(node) ? StyleSheet.flatten((node.props as any).style) : undefined;
}

describe('BottomSheet', () => {
  it('gives the hosted content the sheet width when the sheet sizes to its content', () => {
    render(
      <BottomSheet index={0}>
        <View />
      </BottomSheet>
    );

    expect(findNativeViewProps('RNHostView')?.matchContents).toBe(true);
    expect(hostedViewStyle()?.width).toBe(Dimensions.get('window').width);
  });

  it('fills the snap point height when snap points are set', () => {
    render(
      <BottomSheet index={0} snapPoints={['50%']}>
        <View />
      </BottomSheet>
    );

    expect(findNativeViewProps('RNHostView')?.matchContents).toBe(false);
    expect(hostedViewStyle()).toEqual(expect.objectContaining({ flexGrow: 1, height: 0 }));
  });
});
