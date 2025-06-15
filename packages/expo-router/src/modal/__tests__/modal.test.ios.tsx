import React, { useState } from 'react';
import { Button, View } from 'react-native';

import { router } from '../../imperative-api';
import { act, fireEvent, renderRouter, screen } from '../../testing-library';
import { Modal } from '../Modal';

const ComponentWithModal = (props?: { onModalClose: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View testID="ComponentWithModal">
      <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
      <Modal visible={isOpen} onClose={props.onModalClose}>
        <View testID="modal-content" />
      </Modal>
    </View>
  );
};

it('modal content is not visible when visible is false', async () => {
  renderRouter({
    index: ComponentWithModal,
  });

  expect(screen.getByTestId('ComponentWithModal')).toBeVisible();
  expect(screen.queryByTestId('modal-content')).toBeFalsy();
});

it('modal opens when visible is true', async () => {
  renderRouter({
    index: ComponentWithModal,
  });

  act(() => fireEvent.press(screen.getByTestId('open-modal')));

  expect(screen.getByTestId('modal-content')).toBeVisible();
  expect(screen.queryByTestId('ComponentWithModal')).toBeFalsy();
});

it('modal emits on close when back is called', async () => {
  const onClose = jest.fn();
  renderRouter({
    index: () => {
      return <ComponentWithModal onModalClose={onClose} />;
    },
  });

  act(() => fireEvent.press(screen.getByTestId('open-modal')));

  expect(screen.getByTestId('modal-content')).toBeVisible();

  act(() => router.back());

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('ComponentWithModal')).toBeVisible();
  expect(screen.queryByTestId('modal-content')).toBeFalsy();
});
