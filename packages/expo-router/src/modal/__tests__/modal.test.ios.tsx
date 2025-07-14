import React, { useState } from 'react';
import { Button, View } from 'react-native';

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

jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  return {
    ...actual,
    ScreenStackItem: jest.fn((props) => <actual.ScreenStackItem {...props} />),
  };
});

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

describe('ScreenStackItem props', () => {
  const showModal = () => {
    const ScreenStackItem = require('react-native-screens').ScreenStackItem;

    act(() => fireEvent.press(screen.getByTestId('open-modal')));

    expect(screen.getByTestId('modal-content')).toBeVisible();
    expect(ScreenStackItem).toHaveBeenCalledTimes(3);
    // The first two calls are for the root stack. They should be the same.
    expect(ScreenStackItem.mock.calls[0][0]).toEqual({
      ...ScreenStackItem.mock.calls[1][0],
      children: expect.anything(),
    });
  };

  it('correct props are passed to ScreenStackItem based on Modal props', async () => {
    const detents = [0.25, 0.5, 0.75, 1];

    const CustomComponentWithModal = (props?: { onModalClose: () => void }) => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <View testID="CustomComponentWithModal">
          <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
          <Modal visible={isOpen} onClose={props.onModalClose} detents={detents}>
            <View testID="modal-content" />
          </Modal>
        </View>
      );
    };

    renderRouter({
      index: CustomComponentWithModal,
    });
    const ScreenStackItem = require('react-native-screens').ScreenStackItem;
    showModal();

    expect(ScreenStackItem.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        screenId: expect.stringContaining(''),
        activityState: 2,
        stackPresentation: 'fullScreenModal',
        stackAnimation: 'slide_from_bottom',
        nativeBackButtonDismissalEnabled: true,
        headerConfig: {
          hidden: true,
        },
        sheetAllowedDetents: detents,
      })
    );
  });
  it.each([
    { presentationStyle: undefined, expectedType: 'fullScreenModal' },
    { presentationStyle: 'fullScreen', expectedType: 'fullScreenModal' },
    { presentationStyle: 'overFullScreen', expectedType: 'transparentModal' },
    { presentationStyle: 'pageSheet', expectedType: 'pageSheet' },
    { presentationStyle: 'formSheet', expectedType: 'formSheet' },
  ] as const)(
    "stack type is $expectedType for modal with presentation style '$presentationStyle' and transparent false",
    async ({ presentationStyle, expectedType }) => {
      const CustomComponentWithModal = (props?: { onModalClose: () => void }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <View testID="CustomComponentWithModal">
            <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
            <Modal
              visible={isOpen}
              onClose={props.onModalClose}
              presentationStyle={presentationStyle}
              transparent={false}>
              <View testID="modal-content" />
            </Modal>
          </View>
        );
      };

      renderRouter({
        index: CustomComponentWithModal,
      });

      const ScreenStackItem = require('react-native-screens').ScreenStackItem;
      showModal();

      expect(ScreenStackItem.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          stackPresentation: expectedType,
        })
      );
    }
  );

  it.each([
    { presentationStyle: undefined, expectedType: 'transparentModal' },
    { presentationStyle: 'fullScreen', expectedType: 'transparentModal' },
    { presentationStyle: 'overFullScreen', expectedType: 'transparentModal' },
    { presentationStyle: 'pageSheet', expectedType: 'pageSheet' },
    { presentationStyle: 'formSheet', expectedType: 'formSheet' },
  ] as const)(
    "stack type is $expectedType for modal with presentation style '$presentationStyle' and transparent true",
    async ({ presentationStyle, expectedType }) => {
      const CustomComponentWithModal = (props?: { onModalClose: () => void }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <View testID="CustomComponentWithModal">
            <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
            <Modal
              visible={isOpen}
              onClose={props.onModalClose}
              presentationStyle={presentationStyle}
              transparent>
              <View testID="modal-content" />
            </Modal>
          </View>
        );
      };

      renderRouter({
        index: CustomComponentWithModal,
      });

      const ScreenStackItem = require('react-native-screens').ScreenStackItem;
      showModal();

      expect(ScreenStackItem.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          stackPresentation: expectedType,
        })
      );
    }
  );

  it.each([
    { detents: [1] },
    { detents: [0.2, 0.4, 0.84123, 1] },
    { detents: 'fitToContents' } as const,
  ])('for detents $detents, passes them to ScreenStackItem', async ({ detents }) => {
    const CustomComponentWithModal = (props?: { onModalClose: () => void }) => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <View testID="CustomComponentWithModal">
          <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
          <Modal
            visible={isOpen}
            onClose={props.onModalClose}
            presentationStyle="formSheet"
            detents={detents}>
            <View testID="modal-content" />
          </Modal>
        </View>
      );
    };

    renderRouter({
      index: CustomComponentWithModal,
    });

    const ScreenStackItem = require('react-native-screens').ScreenStackItem;
    showModal();

    expect(ScreenStackItem.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        sheetAllowedDetents: detents,
      })
    );
  });

  it('when passing invalid detents [-1,0,2,1], expects an error when opening modal', () => {
    const CustomComponentWithModal = (props?: { onModalClose: () => void }) => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <View testID="CustomComponentWithModal">
          <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
          <Modal
            visible={isOpen}
            onClose={props.onModalClose}
            presentationStyle="formSheet"
            detents={[-1, 0, 2, 1]}>
            <View testID="modal-content" />
          </Modal>
        </View>
      );
    };

    expect(() =>
      renderRouter({
        index: CustomComponentWithModal,
      })
    ).toThrow('Invalid detents provided to Modal: [-1,0,2,1]');
  });
});
