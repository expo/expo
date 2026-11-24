import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { ModalBottomSheet } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

it('unwraps all native sheet state values', async () => {
  const onCurrentValueChange = jest.fn();
  await render(
    <ModalBottomSheet onDismissRequest={() => {}} onCurrentValueChange={onCurrentValueChange}>
      <View />
    </ModalBottomSheet>
  );
  const props = findNativeViewProps('ModalBottomSheetView');
  for (const value of ['partiallyExpanded', 'expanded', 'hidden']) {
    props.onCurrentValueChange({ nativeEvent: { value } });
  }
  expect(onCurrentValueChange.mock.calls).toEqual([
    ['partiallyExpanded'],
    ['expanded'],
    ['hidden'],
  ]);
});
