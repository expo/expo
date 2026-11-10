import { act, render } from '@testing-library/react-native';
import { createRef, isValidElement, type ReactNode } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

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

  itAndroid(
    'gives the hosted content the window width when the sheet sizes to its content',
    async () => {
      await render(
        <BottomSheet index={0}>
          <View />
        </BottomSheet>
      );

      expect(findNativeViewProps('RNHostView')).toEqual(
        expect.objectContaining({ matchContentsHorizontal: true, matchContentsVertical: true })
      );
      expect(hostedViewStyle()?.width).toBe(Dimensions.get('window').width);
    }
  );

  itIOS(
    'selects the requested detent on the first render after the index and snap points change',
    async () => {
      const view = await render(
        <BottomSheet index={0} snapPoints={['40%', '60%']}>
          <View />
        </BottomSheet>
      );
      renderedNativeViews.mockClear();

      // A smaller snap point is added in front, and the index moves so the sheet stays at 40%.
      await view.rerender(
        <BottomSheet index={1} snapPoints={['20%', '40%', '60%']}>
          <View />
        </BottomSheet>
      );

      // Every render the native sheet receives must select 40%. If a render passes the
      // previous index, SwiftUI moves the sheet to 20% for a frame and then back to 40%.
      const selections = renderedNativeViews.mock.calls
        .filter(([name]) => name === 'GroupView')
        .map(([, props]) =>
          props.modifiers.find((m: { $type: string }) => m.$type === 'presentationDetents')
        )
        .map((modifier) => modifier?.selection);
      expect(selections.length).toBeGreaterThan(0);
      expect(selections).toEqual(selections.map(() => ({ fraction: 0.4 })));
    }
  );

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
