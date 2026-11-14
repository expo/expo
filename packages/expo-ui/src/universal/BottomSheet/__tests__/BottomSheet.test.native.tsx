import { act, render } from '@testing-library/react-native';
import { Platform, View } from 'react-native';

import { BottomSheet } from '..';
import { renderedNativeViews } from '../../../__mocks__/expo';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

const itIOS = Platform.OS === 'ios' ? it : it.skip;
const itAndroid = Platform.OS === 'android' ? it : it.skip;

function latestProps(name: string) {
  return renderedNativeViews.mock.calls.findLast(([viewName]) => viewName === name)?.[1];
}

itIOS('maps native detents to snap points and ignores events while closed', async () => {
  const onSnapPointChange = jest.fn();
  const sheet = (isPresented: boolean) => (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={() => {}}
      snapPoints={['half', 'full', { fraction: 0.3 }, { height: 200 }]}
      onSnapPointChange={onSnapPointChange}>
      <View />
    </BottomSheet>
  );
  const view = await render(sheet(true));
  expect(onSnapPointChange).not.toHaveBeenCalled();
  const emit = (detent: unknown) => {
    latestProps('GroupView').onGlobalEvent({ nativeEvent: { presentationDetents: { detent } } });
  };

  await act(() => {
    emit('large');
    emit('medium');
    emit({ fraction: 0.3 });
    emit({ height: 200 });
  });
  expect(onSnapPointChange.mock.calls).toEqual([
    ['full'],
    ['half'],
    [{ fraction: 0.3 }],
    [{ height: 200 }],
  ]);
  await view.rerender(sheet(false));
  await act(() => emit('large'));
  expect(onSnapPointChange).toHaveBeenCalledTimes(4);
});

itAndroid(
  'reports visible state changes but not presentation, dismissal, or duplicate events',
  async () => {
    const onSnapPointChange = jest.fn();
    const sheet = (isPresented: boolean) => (
      <BottomSheet
        isPresented={isPresented}
        onDismiss={() => {}}
        snapPoints={['half', 'full']}
        onSnapPointChange={onSnapPointChange}>
        <View />
      </BottomSheet>
    );
    const view = await render(sheet(true));
    const emit = (value: string) => {
      latestProps('ModalBottomSheetView').onCurrentValueChange({ nativeEvent: { value } });
    };
    await act(() => {
      emit('partiallyExpanded');
      emit('expanded');
      emit('expanded');
      emit('partiallyExpanded');
      emit('hidden');
    });
    expect(onSnapPointChange.mock.calls).toEqual([['full'], ['half']]);

    // Keep the native hide animation pending while a queued state event arrives.
    latestProps('ModalBottomSheetView').ref.current.hide = () => new Promise<void>(() => {});
    await view.rerender(sheet(false));
    await act(() => emit('expanded'));
    await view.rerender(sheet(true));
    await act(() => {
      emit('expanded');
      emit('partiallyExpanded');
    });
    expect(onSnapPointChange.mock.calls).toEqual([['full'], ['half'], ['half']]);
  }
);
