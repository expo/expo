import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { useSQLiteContext, SQLiteProvider } from '../hooks';

jest.mock('../ExpoSQLiteNext');

describe(useSQLiteContext, () => {
  it('should return a SQLite database instance', async () => {
    const wrapper = ({ children }) => <SQLiteProvider dbName=":memory:">{children}</SQLiteProvider>;
    const { result } = renderHook(() => useSQLiteContext(), { wrapper });
    await act(async () => {
      await waitFor(() => {
        expect(result).not.toBeNull();
      });
    });
    expect(result.current).toHaveProperty('execAsync');
    expect(result.current).toHaveProperty('runAsync');
  });

  it('should return the same SQLite instance on subsequent calls', async () => {
    const wrapper = ({ children }) => <SQLiteProvider dbName=":memory:">{children}</SQLiteProvider>;
    const { result, rerender } = renderHook(() => useSQLiteContext(), { wrapper });
    await act(async () => {
      await waitFor(() => {
        expect(result).not.toBeNull();
      });
    });
    const firstResult = result.current;
    await rerender({});
    expect(result.current).toBe(firstResult);
  });

  it('should run initHandler before rendering children', async () => {
    const mockInitHandler = jest.fn();
    const wrapper = ({ children }) => (
      <SQLiteProvider dbName=":memory:" initHandler={mockInitHandler}>
        {children}
      </SQLiteProvider>
    );
    const { result } = renderHook(() => useSQLiteContext(), { wrapper });
    await act(async () => {
      await waitFor(() => {
        expect(result).not.toBeNull();
      });
    });
    expect(mockInitHandler).toHaveBeenCalled();
    expect(mockInitHandler.mock.calls[0][0]).toBe(result.current);
  });

  it('should call errorHandler from SQLiteProvider if failed to open database', async () => {
    const mockErroHandler = jest.fn();
    render(
      <SQLiteProvider dbName="/nonexistent/nonexistent.db" errorHandler={mockErroHandler}>
        <View />
      </SQLiteProvider>
    );
    await act(async () => {
      await waitFor(() => {
        expect(mockErroHandler).toHaveBeenCalled();
      });
    });
  });
});
