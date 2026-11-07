import { act, render } from '@testing-library/react-native';
import { createRef } from 'react';
import { Platform, View } from 'react-native';

import { BottomSheet, BottomSheetModal } from '..';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

const mockHide = jest.fn(() => Promise.resolve());
const mockExpand = jest.fn(() => Promise.resolve());
const mockPartialExpand = jest.fn(() => Promise.resolve());

// The native views mock does not forward a usable ref. These cases need the imperative
// `hide` promise that the adapter awaits before it fires the close callbacks.
jest.mock('../../../jetpack-compose/ModalBottomSheet', () => {
  const React = jest.requireActual('react');
  const { View: MockView } = jest.requireActual('react-native');
  const ModalBottomSheet = React.forwardRef((props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      hide: mockHide,
      expand: mockExpand,
      partialExpand: mockPartialExpand,
    }));
    return React.createElement(
      MockView,
      { testID: 'modal-bottom-sheet' },
      (props as { children?: unknown }).children
    );
  });
  ModalBottomSheet.displayName = 'ModalBottomSheet';
  return { ModalBottomSheet };
});

const itAndroid = Platform.OS === 'android' ? it : it.skip;

describe('BottomSheet imperative methods', () => {
  itAndroid('closes a modal and fires the close callbacks when dismiss() is called', async () => {
    const ref = createRef<BottomSheetModal>();
    const onChange = jest.fn();
    const onClose = jest.fn();
    const onDismiss = jest.fn();
    const view = await render(
      <BottomSheetModal
        ref={ref}
        snapPoints={['40%', '80%']}
        onChange={onChange}
        onClose={onClose}
        onDismiss={onDismiss}>
        <View />
      </BottomSheetModal>
    );

    await act(() => ref.current?.present());
    expect(view.toJSON()).not.toBeNull();
    onChange.mockClear();

    await act(async () => {
      ref.current?.dismiss();
    });

    expect(view.toJSON()).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(-1);
  });

  itAndroid('closes a sheet and fires the close callbacks when close() is called', async () => {
    const ref = createRef<BottomSheet>();
    const onChange = jest.fn();
    const onClose = jest.fn();
    const view = await render(
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={['40%', '80%']}
        onChange={onChange}
        onClose={onClose}>
        <View />
      </BottomSheet>
    );
    expect(view.toJSON()).not.toBeNull();
    onChange.mockClear();

    await act(async () => {
      ref.current?.close();
    });

    expect(view.toJSON()).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(-1);
  });

  itAndroid(
    'keeps the modal open when the selected snap point is removed and restored',
    async () => {
      const ref = createRef<BottomSheetModal>();
      const onChange = jest.fn();
      const onClose = jest.fn();
      const renderModal = (snapPoints: string[]) => (
        <BottomSheetModal ref={ref} snapPoints={snapPoints} onChange={onChange} onClose={onClose}>
          <View />
        </BottomSheetModal>
      );

      const view = await render(renderModal(['40%', '80%']));
      await act(() => ref.current?.present());
      await act(() => ref.current?.expand());
      expect(onChange).toHaveBeenLastCalledWith(1);
      onChange.mockClear();

      await view.rerender(renderModal(['40%']));
      expect(view.toJSON()).not.toBeNull();
      expect(onChange).not.toHaveBeenCalledWith(-1);
      expect(onClose).not.toHaveBeenCalled();

      await view.rerender(renderModal(['40%', '80%']));
      expect(view.toJSON()).not.toBeNull();
      expect(onChange).not.toHaveBeenCalledWith(-1);
      expect(onClose).not.toHaveBeenCalled();
    }
  );
});
