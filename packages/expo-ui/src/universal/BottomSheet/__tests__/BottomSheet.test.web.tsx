/**
 * @jest-environment jsdom
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import { Text } from 'react-native';

import { BottomSheet } from '..';

function dispatchPointer(
  target: EventTarget,
  type: string,
  init: { pointerId: number; clientY: number; button?: number }
) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, {
    pointerId: init.pointerId,
    clientY: init.clientY,
    button: init.button ?? 0,
    buttons: 0,
  });
  target.dispatchEvent(event);
}

describe('BottomSheet', () => {
  it('should stay closed when isPresented is false', () => {
    render(
      <BottomSheet isPresented={false} onDismiss={() => {}}>
        <Text>Hello from BottomSheet</Text>
      </BottomSheet>
    );

    expect(screen.queryByTestId('expo-ui-bottom-sheet')).toBeNull();
  });

  it('should open when isPresented is true', async () => {
    render(
      <BottomSheet isPresented onDismiss={() => {}}>
        <Text>Hello from BottomSheet</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });
    expect(screen.getByText('Hello from BottomSheet')).toBeTruthy();
  });

  it('should hide the handle when showDragIndicator is false', async () => {
    render(
      <BottomSheet isPresented onDismiss={() => {}} showDragIndicator={false}>
        <Text>No handle</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });

    expect(screen.queryByTestId('expo-ui-bottom-sheet-handle')).toBeNull();
  });

  it('should show the handle by default when the sheet is presented', async () => {
    render(
      <BottomSheet isPresented onDismiss={() => {}}>
        <Text>Has handle</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet-handle')).toBeTruthy();
    });
  });

  it('should render when contentPadding is 0', async () => {
    render(
      <BottomSheet isPresented onDismiss={() => {}} testID="flush-content" contentPadding={0}>
        <Text>Flush</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('flush-content')).toBeTruthy();
    });
    expect(screen.getByText('Flush')).toBeTruthy();
  });

  it('should reopen at the first snap height after dragging to a taller snap', async () => {
    const { rerender } = render(
      <BottomSheet isPresented onDismiss={() => {}} snapPoints={[{ height: 200 }, { height: 500 }]}>
        <Text>Snap sheet</Text>
      </BottomSheet>
    );

    const panel = await waitFor(() => screen.getByTestId('expo-ui-bottom-sheet'));
    expect(panel.style.height).toBe('200px');

    act(() => {
      dispatchPointer(panel, 'pointerdown', { pointerId: 1, clientY: 400, button: 0 });
      dispatchPointer(window, 'pointermove', { pointerId: 1, clientY: 100 });
      dispatchPointer(window, 'pointerup', { pointerId: 1, clientY: 100 });
    });

    expect(panel.style.height).toBe('500px');

    rerender(
      <BottomSheet
        isPresented={false}
        onDismiss={() => {}}
        snapPoints={[{ height: 200 }, { height: 500 }]}>
        <Text>Snap sheet</Text>
      </BottomSheet>
    );
    rerender(
      <BottomSheet isPresented onDismiss={() => {}} snapPoints={[{ height: 200 }, { height: 500 }]}>
        <Text>Snap sheet</Text>
      </BottomSheet>
    );

    expect(screen.getByTestId('expo-ui-bottom-sheet').style.height).toBe('200px');
  });

  it('should clamp the snap index when snapPoints shrinks', async () => {
    const { rerender } = render(
      <BottomSheet isPresented onDismiss={() => {}} snapPoints={[{ height: 200 }, { height: 500 }]}>
        <Text>Snap sheet</Text>
      </BottomSheet>
    );

    const panel = await waitFor(() => screen.getByTestId('expo-ui-bottom-sheet'));
    act(() => {
      dispatchPointer(panel, 'pointerdown', { pointerId: 1, clientY: 400, button: 0 });
      dispatchPointer(window, 'pointermove', { pointerId: 1, clientY: 100 });
      dispatchPointer(window, 'pointerup', { pointerId: 1, clientY: 100 });
    });
    expect(panel.style.height).toBe('500px');

    rerender(
      <BottomSheet isPresented onDismiss={() => {}} snapPoints={[{ height: 200 }]}>
        <Text>Snap sheet</Text>
      </BottomSheet>
    );

    expect(screen.getByTestId('expo-ui-bottom-sheet').style.height).toBe('200px');
  });

  it('should apply testID to the inner content container', async () => {
    render(
      <BottomSheet isPresented onDismiss={() => {}} testID="universal-sheet-content">
        <Text>Labeled</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('universal-sheet-content')).toBeTruthy();
    });
  });
});
