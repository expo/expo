/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Text } from 'react-native';

import { BottomSheet } from '..';

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
