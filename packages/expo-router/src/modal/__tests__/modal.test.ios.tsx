import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';

import { act, fireEvent, renderRouter, screen } from '../../testing-library';
import { Modal } from '../Modal';

const ComponentWithModal = (props?: { onRequestClose?: () => void; onDidClose?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  return (
    <View testID="ComponentWithModal">
      <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
      <Button testID="close-modal" title="Close modal" onPress={() => setIsOpen(false)} />
      <Button
        testID="unmount-modal"
        title="Unmount modal"
        onPress={() => {
          setIsMounted(false);
        }}
      />
      {isMounted && (
        <Modal visible={isOpen} onRequestClose={props.onRequestClose} onDidClose={props.onDidClose}>
          <View testID="modal-content" />
        </Modal>
      )}
    </View>
  );
};

describe('Content visibility', () => {
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
  });
  it('modal content is not visible when modal is closed', async () => {
    renderRouter({
      index: ComponentWithModal,
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal')));
    expect(screen.getByTestId('modal-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('close-modal')));
    expect(screen.queryByTestId('modal-content')).toBeFalsy();
  });
  it('when modal is opened and state changes, modal content is still visible and updated', async () => {
    const onDidClose = jest.fn();
    const ComponentWithState = () => {
      const [index, setIndex] = useState(0);
      return (
        <View>
          <Button
            testID="increase-index"
            title="Increase index"
            onPress={() => setIndex((prev) => prev + 1)}
          />
          <Modal visible onDidClose={onDidClose}>
            <View testID="modal-content">
              <Text>Index: {index}</Text>
            </View>
          </Modal>
        </View>
      );
    };
    renderRouter({
      index: ComponentWithState,
    });
    expect(screen.getByTestId('modal-content')).toHaveTextContent('Index: 0');
    act(() => fireEvent.press(screen.getByTestId('increase-index')));
    expect(screen.getByTestId('modal-content')).toHaveTextContent('Index: 1');
    act(() => fireEvent.press(screen.getByTestId('increase-index')));
    expect(screen.getByTestId('modal-content')).toHaveTextContent('Index: 2');
    expect(onDidClose).not.toHaveBeenCalled();
  });
  it('when modal is opened and state is changed from modal, the modal is still visible and updated', async () => {
    const onDidClose = jest.fn();
    const ComponentWithState = () => {
      const [index, setIndex] = useState(0);
      return (
        <View>
          <Modal visible onDidClose={onDidClose}>
            <View testID="modal-content">
              <Text>Index: {index}</Text>
            </View>
            <Button
              testID="increase-index"
              title="Increase index"
              onPress={() => setIndex((prev) => prev + 1)}
            />
          </Modal>
        </View>
      );
    };
    renderRouter({
      index: ComponentWithState,
    });
    expect(screen.getByTestId('modal-content')).toHaveTextContent('Index: 0');
    act(() => fireEvent.press(screen.getByTestId('increase-index')));
    expect(screen.getByTestId('modal-content')).toHaveTextContent('Index: 1');
    act(() => fireEvent.press(screen.getByTestId('increase-index')));
    expect(screen.getByTestId('modal-content')).toHaveTextContent('Index: 2');
    expect(onDidClose).not.toHaveBeenCalled();
  });
});

describe('onDidClose', () => {
  it('calls onDidClose when modal is closed', async () => {
    const onDidClose = jest.fn();
    renderRouter({
      index: () => <ComponentWithModal onDidClose={onDidClose} />,
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal')));
    expect(screen.getByTestId('modal-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('close-modal')));
    expect(onDidClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('modal-content')).toBeFalsy();
  });

  it('calls onDidClose when modal is unmounted', async () => {
    const onDidClose = jest.fn();
    renderRouter({
      index: () => <ComponentWithModal onDidClose={onDidClose} />,
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal')));
    expect(screen.getByTestId('modal-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('unmount-modal')));
    expect(onDidClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('modal-content')).toBeFalsy();
  });

  it.skip('calls onDidClose when modal is closed with native dismissal', async () => {
    // TODO:
  });
});

describe('onRequestClose', () => {
  it.skip('calls onRequestClose when modal is closed with native dismissal', async () => {
    // TODO:
  });
  it('does not call onRequestClose when modal is closed programmatically', async () => {
    const onRequestClose = jest.fn();
    renderRouter({
      index: () => <ComponentWithModal onRequestClose={onRequestClose} />,
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal')));
    expect(screen.getByTestId('modal-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('close-modal')));
    expect(onRequestClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId('modal-content')).toBeFalsy();
  });
  it('does not call onRequestClose when modal is unmounted', async () => {
    const onRequestClose = jest.fn();
    renderRouter({
      index: () => <ComponentWithModal onRequestClose={onRequestClose} />,
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal')));
    expect(screen.getByTestId('modal-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('unmount-modal')));
    expect(onRequestClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId('modal-content')).toBeFalsy();
  });
});
