import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { useSQLiteContext, SQLiteProvider } from '../hooks';

jest.mock('../ExpoSQLiteNext');

describe(useSQLiteContext, () => {
  it('should return a SQLite database instance', async () => {
    const wrapper = ({ children }) => (
      <SQLiteProvider databaseName=":memory:">{children}</SQLiteProvider>
    );
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
    const wrapper = ({ children }) => (
      <SQLiteProvider databaseName=":memory:">{children}</SQLiteProvider>
    );
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

  it('should run onInit before rendering children', async () => {
    const mockonInit = jest.fn();
    const wrapper = ({ children }) => (
      <SQLiteProvider databaseName=":memory:" onInit={mockonInit}>
        {children}
      </SQLiteProvider>
    );
    const { result } = renderHook(() => useSQLiteContext(), { wrapper });
    await act(async () => {
      await waitFor(() => {
        expect(result).not.toBeNull();
      });
    });
    expect(mockonInit).toHaveBeenCalled();
    expect(mockonInit.mock.calls[0][0]).toBe(result.current);
  });

  it('should render custom loading fallback before database is ready', async () => {
    const loadingText = 'Loading database...';
    function LoadingFallback() {
      return (
        <View>
          <Text>{loadingText}</Text>
        </View>
      );
    }
    const wrapper = ({ children }) => (
      <SQLiteProvider databaseName=":memory:" loadingFallback={<LoadingFallback />}>
        <View />
      </SQLiteProvider>
    );
    const { result } = renderHook(() => useSQLiteContext(), { wrapper });
    await act(async () => {
      await waitFor(() => {
        expect(screen.queryByText(loadingText)).not.toBeNull();
      });
    });

    // Ensure that the loading fallback is removed after the database is ready
    await act(async () => {
      await waitFor(() => {
        expect(result).not.toBeNull();
      });
    });
    expect(screen.queryByText(loadingText)).toBeNull();
  });

  it('should call onError from SQLiteProvider if failed to open database', async () => {
    const mockErroHandler = jest.fn();
    render(
      <SQLiteProvider databaseName="/nonexistent/nonexistent.db" onError={mockErroHandler}>
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
