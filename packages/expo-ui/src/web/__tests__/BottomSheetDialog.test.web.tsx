/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
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
