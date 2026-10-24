import { act, render } from '@testing-library/react-native';
import { createRef, isValidElement, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { BottomSheetModal } from '..';
import { findNativeViewProps, renderedNativeViews } from '../../../__mocks__/expo';
import { BottomSheet } from '../BottomSheet';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

const itIOS = Platform.OS === 'ios' ? it : it.skip;
const itAndroid = Platform.OS === 'android' ? it : it.skip;

function latestNativeViewProps(viewName: string) {
  return renderedNativeViews.mock.calls.findLast(([name]) => name === viewName)?.[1];
}

// The view `RNHostView` hosts: its first descendant that is a React Native `View`.
function hostedViewStyle() {
  let node: ReactNode = findNativeViewProps('RNHostView')?.children;
  while (isValidElement(node) && node.type !== View) {
    node = (node.props as { children?: ReactNode }).children;
  }
  return isValidElement(node) ? StyleSheet.flatten((node.props as any).style) : undefined;
}

describe('BottomSheet', () => {
  itIOS('takes the width from the sheet when the sheet sizes to its content', async () => {
    await render(
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

  itAndroid('takes the width from the sheet when the sheet sizes to its content', async () => {
    await render(
      <BottomSheet index={0}>
        <View />
      </BottomSheet>
    );

    expect(findNativeViewProps('PresentationHostView')).toBeDefined();
    expect(findNativeViewProps('RNHostView')).toEqual(
      expect.objectContaining({ matchContentsHorizontal: false, matchContentsVertical: true })
    );
    expect(hostedViewStyle()?.width).toBeUndefined();
  });

  it('fills the snap point height when snap points are set', async () => {
    await render(
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

describe('BottomSheetModal', () => {
  itIOS.each([
    { change: 'added', initial: ['40%'], next: ['40%', '80%'] },
    { change: 'removed', initial: ['40%', '80%'], next: ['40%'] },
  ])('keeps an open modal presented when snap points are $change', async ({ initial, next }) => {
    const ref = createRef<BottomSheetModal>();
    const view = await render(
      <BottomSheetModal ref={ref} snapPoints={initial}>
        <View />
      </BottomSheetModal>
    );

    await act(() => ref.current?.present());
    expect(latestNativeViewProps('BottomSheetView')?.isPresented).toBe(true);

    await view.rerender(
      <BottomSheetModal ref={ref} snapPoints={next}>
        <View />
      </BottomSheetModal>
    );

    expect(latestNativeViewProps('BottomSheetView')?.isPresented).toBe(true);
  });

  itIOS(
    'keeps the remaining snap point selected after the active snap point is removed',
    async () => {
      const ref = createRef<BottomSheetModal>();
      const view = await render(
        <BottomSheetModal ref={ref} snapPoints={['40%', '80%']}>
          <View />
        </BottomSheetModal>
      );

      await act(() => ref.current?.present());
      await act(() => ref.current?.expand());
      expect(latestNativeViewProps('GroupView')?.modifiers).toContainEqual(
        expect.objectContaining({ $type: 'presentationDetents', selection: { fraction: 0.8 } })
      );

      await view.rerender(
        <BottomSheetModal ref={ref} snapPoints={['40%']}>
          <View />
        </BottomSheetModal>
      );
      expect(latestNativeViewProps('BottomSheetView')?.isPresented).toBe(true);

      await view.rerender(
        <BottomSheetModal ref={ref} snapPoints={['40%', '80%']}>
          <View />
        </BottomSheetModal>
      );
      expect(latestNativeViewProps('GroupView')?.modifiers).toContainEqual(
        expect.objectContaining({ $type: 'presentationDetents', selection: { fraction: 0.4 } })
      );
    }
  );
});
