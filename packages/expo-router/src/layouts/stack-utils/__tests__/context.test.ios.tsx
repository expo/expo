import { renderHook } from '@testing-library/react-native';
import React from 'react';

import { ToolbarPlacementContext, useToolbarPlacement } from '../toolbar/context';

describe('ToolbarPlacementContext', () => {
  it('has null as default value', () => {
    const { result } = renderHook(() => useToolbarPlacement());
    expect(result.current).toBeNull();
  });

  it.each(['left', 'right', 'bottom'] as const)(
    'returns "%s" when provided via context',
    (placement) => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToolbarPlacementContext.Provider value={placement}>
          {children}
        </ToolbarPlacementContext.Provider>
      );
      const { result } = renderHook(() => useToolbarPlacement(), { wrapper });
      expect(result.current).toBe(placement);
    }
  );
});
