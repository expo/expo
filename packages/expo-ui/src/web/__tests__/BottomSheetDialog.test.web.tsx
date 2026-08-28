/**
 * @jest-environment jsdom
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import { Text } from 'react-native';

import { BottomSheetDialog } from '../BottomSheetDialog';

describe('BottomSheetDialog handle contrast', () => {
  it('should use a dark handle on a light sheet', async () => {
    render(
      <BottomSheetDialog open onOpenChange={() => {}}>
        <Text>Body</Text>
      </BottomSheetDialog>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet-handle')).toBeTruthy();
    });

    expect(screen.getByTestId('expo-ui-bottom-sheet-handle').style.backgroundColor).toBe(
      'rgba(60, 60, 67, 0.3)'
    );
  });

  it('should not expose the overlay as a button', async () => {
    render(
      <BottomSheetDialog open onOpenChange={() => {}}>
        <Text>Body</Text>
      </BottomSheetDialog>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet-overlay')).toBeTruthy();
    });

    const overlay = screen.getByTestId('expo-ui-bottom-sheet-overlay');
    expect(overlay.tagName.toLowerCase()).toBe('div');
    expect(overlay.getAttribute('role')).not.toBe('button');
    expect(overlay.getAttribute('tabindex')).toBeNull();
  });

  it('should use a light handle on a dark sheet', async () => {
    render(
      <BottomSheetDialog open onOpenChange={() => {}} style={{ backgroundColor: '#000' }}>
        <Text>Body</Text>
      </BottomSheetDialog>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet-handle')).toBeTruthy();
    });

    expect(screen.getByTestId('expo-ui-bottom-sheet-handle').style.backgroundColor).toBe(
      'rgba(235, 235, 245, 0.55)'
    );
  });
});

describe('BottomSheetDialog body scroll lock', () => {
  it('should keep the page locked until the last open sheet closes', async () => {
    const { rerender } = render(
      <>
        <BottomSheetDialog open onOpenChange={() => {}}>
          <Text>One</Text>
        </BottomSheetDialog>
        <BottomSheetDialog open onOpenChange={() => {}}>
          <Text>Two</Text>
        </BottomSheetDialog>
      </>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('expo-ui-bottom-sheet')).toHaveLength(2);
    });
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <>
        <BottomSheetDialog open={false} onOpenChange={() => {}}>
          <Text>One</Text>
        </BottomSheetDialog>
        <BottomSheetDialog open onOpenChange={() => {}}>
          <Text>Two</Text>
        </BottomSheetDialog>
      </>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <>
        <BottomSheetDialog open={false} onOpenChange={() => {}}>
          <Text>One</Text>
        </BottomSheetDialog>
        <BottomSheetDialog open={false} onOpenChange={() => {}}>
          <Text>Two</Text>
        </BottomSheetDialog>
      </>
    );

    expect(document.body.style.overflow).not.toBe('hidden');
  });
});

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
  });
  target.dispatchEvent(event);
}

describe('BottomSheetDialog drag cancel', () => {
  it('should abort the drag on pointercancel without dismissing or snapping', async () => {
    const onOpenChange = jest.fn();
    const onDragEnd = jest.fn();
    render(
      <BottomSheetDialog
        open
        onOpenChange={onOpenChange}
        onDragEnd={onDragEnd}
        height={400}
        minSnapHeight={200}>
        <Text>Body</Text>
      </BottomSheetDialog>
    );

    const panel = await waitFor(() => screen.getByTestId('expo-ui-bottom-sheet'));
    act(() => {
      dispatchPointer(panel, 'pointerdown', { pointerId: 1, clientY: 100, button: 0 });
      dispatchPointer(window, 'pointermove', { pointerId: 1, clientY: 180 });
      dispatchPointer(window, 'pointercancel', { pointerId: 1, clientY: 500 });
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
  });
});
