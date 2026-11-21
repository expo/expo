import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { useIsPresentedInOwnWindow } from '../PresentedContentContext';
import { ModalBottomSheet } from '../jetpack-compose/ModalBottomSheet';

jest.mock('expo', () => ({
  requireNativeView: (_moduleName: string, viewName: string) => {
    const { View } = require('react-native');
    const { createElement } = require('react');
    return (props: Record<string, unknown>) => createElement(View, { ...props, testID: viewName });
  },
}));

function FooterContent() {
  const isPresented = useIsPresentedInOwnWindow();
  return <Text>{isPresented ? 'Presented footer' : 'Inline footer'}</Text>;
}

it('marks the footer slot and keeps its content in the presented window', async () => {
  const screen = await render(
    <ModalBottomSheet fitToContents onDismissRequest={() => {}}>
      <View />
      <ModalBottomSheet.Footer>
        <FooterContent />
      </ModalBottomSheet.Footer>
    </ModalBottomSheet>
  );

  expect(screen.getByTestId('ModalBottomSheetView').props.fitToContents).toBe(true);
  expect(screen.getByTestId('SlotView').props.slotName).toBe('footer');
  expect(screen.getByText('Presented footer')).toBeTruthy();
});

it.each([undefined, true, false])('forwards sizing without a footer: %s', async (fitToContents) => {
  const screen = await render(
    <ModalBottomSheet fitToContents={fitToContents} onDismissRequest={() => {}}>
      <View />
    </ModalBottomSheet>
  );

  expect(screen.getByTestId('ModalBottomSheetView').props.fitToContents).toBe(
    fitToContents ?? true
  );
  expect(screen.queryByTestId('SlotView')).toBeNull();
});
