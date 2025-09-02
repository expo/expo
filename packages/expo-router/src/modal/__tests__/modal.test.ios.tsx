import { act, fireEvent, screen } from '@testing-library/react-native';
import React, { Fragment, useState } from 'react';
import { Button, Text, View } from 'react-native';

import { renderRouter } from '../../testing-library';
import { Modal } from '../Modal';

const ComponentWithModal = (props?: { onModalClose?: () => void }) => {
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
        <Modal visible={isOpen} onClose={props.onModalClose}>
          <View testID="modal-content" />
        </Modal>
      )}
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
    const onClose = jest.fn();
    const ComponentWithState = () => {
      const [index, setIndex] = useState(0);
      return (
        <View>
          <Button
            testID="increase-index"
            title="Increase index"
            onPress={() => setIndex((prev) => prev + 1)}
          />
          <Modal visible onClose={onClose}>
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
    expect(onClose).not.toHaveBeenCalled();
  });

  it('when modal is opened and state is changed from modal, the modal is still visible and updated', async () => {
    const onClose = jest.fn();
    const ComponentWithState = () => {
      const [index, setIndex] = useState(0);
      return (
        <View>
          <Modal visible onClose={onClose}>
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
    expect(onClose).not.toHaveBeenCalled();
  });
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

  it('When detents are not defined and presentationStyle is formSheet, detents should default to fitToContents', async () => {
    const CustomComponentWithModal = (props?: { onModalClose: () => void }) => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <View testID="CustomComponentWithModal">
          <Button testID="open-modal" title="Open modal" onPress={() => setIsOpen(true)} />
          <Modal visible={isOpen} onClose={props.onModalClose} presentationStyle="formSheet">
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
        sheetAllowedDetents: 'fitToContents',
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

describe('onClose', () => {
  it('calls onClose when modal is closed', async () => {
    const onClose = jest.fn();
    renderRouter({
      index: () => <ComponentWithModal onModalClose={onClose} />,
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal')));
    expect(screen.getByTestId('modal-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('close-modal')));
    act(() => fireEvent.press(screen.getByTestId('close-modal')));

    expect(screen.queryByTestId('modal-content')).toBeFalsy();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal is unmounted', async () => {
    const onClose = jest.fn();
    renderRouter({
      index: () => <ComponentWithModal onModalClose={onClose} />,
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal')));
    expect(screen.getByTestId('modal-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('unmount-modal')));
    expect(screen.queryByTestId('modal-content')).toBeFalsy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it.skip('calls onClose when modal is closed with native dismissal', async () => {
    // TODO(@ubax): Find a way to simulate native dismissal
  });
});

describe('multiple modals', () => {
  const ComponentWithMultipleModals = (props?: {
    modalIds: string[];
    onModalClose?: (id: string) => void;
  }) => {
    const [openModals, setOpenModals] = useState<string[]>([]);
    const closeModal = (id: string) => {
      setOpenModals((prev: string[]) => prev.filter((modalId) => modalId !== id));
    };
    return (
      <View testID="ComponentWithModal">
        {props?.modalIds.map((id) => (
          <Fragment key={id}>
            <Button
              testID={`open-modal-${id}`}
              title={`Open modal ${id}`}
              onPress={() => setOpenModals((prev: string[]) => [...prev, id])}
            />
            <Button
              testID={`close-modal-${id}`}
              title={`Close modal ${id}`}
              onPress={() => {
                closeModal(id);
              }}
            />
            <Modal
              visible={openModals.includes(id)}
              onClose={() => {
                props.onModalClose?.(id);
                closeModal(id);
              }}>
              <View testID={`modal-${id}-content`} />
            </Modal>
          </Fragment>
        ))}
      </View>
    );
  };
  it('when top modal is closed, all modals below stay open', async () => {
    const onClose = jest.fn();
    renderRouter({
      index: () => (
        <ComponentWithMultipleModals modalIds={['a', 'b', 'c']} onModalClose={onClose} />
      ),
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal-b')));
    expect(screen.getByTestId('modal-b-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-a')));
    expect(screen.getByTestId('modal-a-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-c')));
    expect(screen.getByTestId('modal-c-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('close-modal-c')));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('c');
    expect(screen.queryByTestId('modal-c-content')).toBeFalsy();
    expect(screen.getByTestId('modal-b-content')).toBeVisible();
    expect(screen.getByTestId('modal-a-content')).toBeVisible();
  });

  it('when middle modal is closed, all modals below stay open and all modals above are closed', async () => {
    const onClose = jest.fn();
    renderRouter({
      index: () => (
        <ComponentWithMultipleModals modalIds={['a', 'b', 'c', 'd']} onModalClose={onClose} />
      ),
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal-b')));
    expect(screen.getByTestId('modal-b-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-a')));
    expect(screen.getByTestId('modal-a-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-c')));
    expect(screen.getByTestId('modal-c-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-d')));
    expect(screen.getByTestId('modal-d-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('close-modal-a')));
    expect(screen.queryByTestId('modal-a-content')).toBeFalsy();
    expect(screen.queryByTestId('modal-d-content')).toBeFalsy();
    expect(screen.queryByTestId('modal-c-content')).toBeFalsy();
    expect(screen.getByTestId('modal-b-content')).toBeVisible();
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onClose).toHaveBeenCalledWith('a');
    expect(onClose).toHaveBeenCalledWith('c');
    expect(onClose).toHaveBeenCalledWith('d');
  });

  it('when lowest modal is closed, all modals above are closed as well', async () => {
    const onClose = jest.fn();
    renderRouter({
      index: () => (
        <ComponentWithMultipleModals modalIds={['a', 'b', 'c', 'd']} onModalClose={onClose} />
      ),
    });

    act(() => fireEvent.press(screen.getByTestId('open-modal-b')));
    expect(screen.getByTestId('modal-b-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-a')));
    expect(screen.getByTestId('modal-a-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-c')));
    expect(screen.getByTestId('modal-c-content')).toBeVisible();
    act(() => fireEvent.press(screen.getByTestId('open-modal-d')));
    expect(screen.getByTestId('modal-d-content')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('close-modal-b')));
    expect(screen.queryByTestId('modal-a-content')).toBeFalsy();
    expect(screen.queryByTestId('modal-d-content')).toBeFalsy();
    expect(screen.queryByTestId('modal-c-content')).toBeFalsy();
    expect(screen.queryByTestId('modal-b-content')).toBeFalsy();
    expect(onClose).toHaveBeenCalledTimes(4);
    expect(onClose).toHaveBeenCalledWith('a');
    expect(onClose).toHaveBeenCalledWith('c');
    expect(onClose).toHaveBeenCalledWith('d');
    expect(onClose).toHaveBeenCalledWith('b');
  });
});
