/**
 * @jest-environment jsdom
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { Text } from 'react-native';

import BottomSheet, { BottomSheetModal, useBottomSheet } from '..';
import type { BottomSheetMethods } from '../types';

function ProbeOutsideSheet() {
  useBottomSheet();
  return null;
}

function getSheetState() {
  return screen.queryByTestId('expo-ui-bottom-sheet')?.getAttribute('data-state');
}

describe('BottomSheet', () => {
  it('should stay closed when index is -1', () => {
    render(
      <BottomSheet snapPoints={['25%', '50%']} index={-1}>
        <Text>Sheet body</Text>
      </BottomSheet>
    );

    expect(screen.queryByTestId('expo-ui-bottom-sheet')).toBeNull();
  });

  it('should open when snapToIndex(0) is called', async () => {
    const ref = createRef<BottomSheetMethods>();
    render(
      <BottomSheet ref={ref} snapPoints={['25%', '50%']} index={-1}>
        <Text>Sheet body</Text>
      </BottomSheet>
    );

    act(() => {
      ref.current?.snapToIndex(0);
    });

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });
  });

  it('should close when close() is called', async () => {
    const ref = createRef<BottomSheetMethods>();
    render(
      <BottomSheet ref={ref} snapPoints={['25%', '50%']} index={0}>
        <Text>Sheet body</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });

    act(() => {
      ref.current?.close();
    });

    await waitFor(() => {
      expect(getSheetState()).toBe('closed');
    });
  });

  it('should fire onChange(-1) and onClose once on close', async () => {
    const onChange = jest.fn();
    const onClose = jest.fn();
    const ref = createRef<BottomSheetMethods>();
    render(
      <BottomSheet
        ref={ref}
        snapPoints={['25%', '50%']}
        index={0}
        onChange={onChange}
        onClose={onClose}>
        <Text>Sheet body</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });

    act(() => {
      ref.current?.close();
    });

    await waitFor(() => {
      expect(getSheetState()).toBe('closed');
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(-1);
  });

  it('should fire onDismiss once on close when provided as the onClose alias', async () => {
    const onDismiss = jest.fn();
    const ref = createRef<BottomSheetMethods>();
    render(
      <BottomSheet ref={ref} snapPoints={['25%', '50%']} index={0} onDismiss={onDismiss}>
        <Text>Sheet body</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });

    act(() => {
      ref.current?.dismiss();
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('should hide the handle when handleComponent is null', async () => {
    render(
      <BottomSheet snapPoints={['50%']} index={0} handleComponent={null}>
        <Text>Sheet body</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });

    expect(screen.queryByTestId('expo-ui-bottom-sheet-handle')).toBeNull();
  });

  it('should show the handle by default when the sheet is open', async () => {
    render(
      <BottomSheet snapPoints={['50%']} index={0}>
        <Text>Sheet body</Text>
      </BottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet-handle')).toBeTruthy();
    });
  });
});

describe('BottomSheetModal', () => {
  it('should stay closed on mount even when index is 0', () => {
    render(
      <BottomSheetModal snapPoints={['40%', '80%']} index={0}>
        <Text>Modal body</Text>
      </BottomSheetModal>
    );

    expect(screen.queryByTestId('expo-ui-bottom-sheet')).toBeNull();
  });

  it('should open when present() is called', async () => {
    const ref = createRef<BottomSheetMethods>();
    render(
      <BottomSheetModal ref={ref} snapPoints={['40%', '80%']}>
        <Text>Modal body</Text>
      </BottomSheetModal>
    );

    act(() => {
      ref.current?.present();
    });

    await waitFor(() => {
      expect(screen.getByTestId('expo-ui-bottom-sheet')).toBeTruthy();
    });
  });
});

describe('useBottomSheet', () => {
  it('should throw when used outside a sheet', () => {
    expect(() => render(<ProbeOutsideSheet />)).toThrow(
      'useBottomSheet must be used within a BottomSheet component'
    );
  });
});
