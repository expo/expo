import { render } from '@testing-library/react-native';
import { isValidElement, type ReactNode } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

import { findNativeViewProps } from '../../../__mocks__/expo';
import { BottomSheet } from '../BottomSheet';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

const itIOS = Platform.OS === 'ios' ? it : it.skip;
const itAndroid = Platform.OS === 'android' ? it : it.skip;

// The view `RNHostView` hosts: its first descendant that is a React Native `View`.
function hostedViewStyle() {
  let node: ReactNode = findNativeViewProps('RNHostView')?.children;
  while (isValidElement(node) && node.type !== View) {
    node = (node.props as { children?: ReactNode }).children;
  }
  return isValidElement(node) ? StyleSheet.flatten((node.props as any).style) : undefined;
}

describe('BottomSheet', () => {
  itIOS('takes the width from the sheet when the sheet sizes to its content', () => {
    render(
      <BottomSheet index={0}>
        <View />
      </BottomSheet>
    );

    // The sheet can be narrower than the window (iPad, iPhone Duo), so the width must come from it.
    expect(findNativeViewProps('RNHostView')).toEqual(
      expect.objectContaining({ matchContentsHorizontal: false, matchContentsVertical: true })
    );
    expect(hostedViewStyle()?.width).toBeUndefined();
    expect(findNativeViewProps('GroupView')?.modifiers).toContainEqual({
      $type: 'presentationSizing',
      sizing: 'automatic',
      fitted: { horizontal: false, vertical: true },
    });
  });

  itAndroid('gives the hosted content the window width when the sheet sizes to its content', () => {
    render(
      <BottomSheet index={0}>
        <View />
      </BottomSheet>
    );

    expect(findNativeViewProps('RNHostView')).toEqual(
      expect.objectContaining({ matchContentsHorizontal: true, matchContentsVertical: true })
    );
    expect(hostedViewStyle()?.width).toBe(Dimensions.get('window').width);
  });

  it('fills the snap point height when snap points are set', () => {
    render(
      <BottomSheet index={0} snapPoints={['50%']}>
        <View />
      </BottomSheet>
    );

    expect(findNativeViewProps('RNHostView')).toEqual(
      expect.objectContaining({ matchContentsHorizontal: false, matchContentsVertical: false })
    );
    expect(hostedViewStyle()).toEqual(expect.objectContaining({ flexGrow: 1, height: 0 }));
  });
});
