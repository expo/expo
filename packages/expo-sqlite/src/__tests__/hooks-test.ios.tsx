import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Text, View } from 'react-native';

import { useSQLiteContext, SQLiteProvider } from '../hooks';

jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

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
    rerender({});
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

  it('should render custom suspense fallback before database is ready', async () => {
    const loadingText = 'Loading database...';
    function LoadingFallback() {
      return (
        <View>
          <Text>{loadingText}</Text>
        </View>
      );
    }
    const wrapper = ({ children }) => (
      <React.Suspense fallback={<LoadingFallback />}>
        <SQLiteProvider databaseName=":memory:" useSuspense>
          {children}
        </SQLiteProvider>
      </React.Suspense>
    );
    const { result } = renderHook(() => useSQLiteContext(), { wrapper });

    expect(screen.queryByText(loadingText)).not.toBeNull();

    // Ensure that the loading fallback is removed after the database is ready
    await act(async () => {
      await waitFor(() => {
        expect(result).not.toBeNull();
      });
    });
    expect(screen.queryByText(loadingText)).toBeNull();
  }, 10000);

  it('should call onError from SQLiteProvider if failed to open database', async () => {
    const mockErrorHandler = jest.fn();
    render(
      <SQLiteProvider databaseName="/nonexistent/nonexistent.db" onError={mockErrorHandler}>
        <View />
      </SQLiteProvider>
    );
    await waitFor(() => {
      expect(mockErrorHandler).toHaveBeenCalled();
    });
  });

  it('should throw to error boundaries if failed to open database with `useSuspense`', async () => {
    const errorText = 'Failed to open database...';
    function ErrorFallback() {
      return (
        <View>
          <Text>{errorText}</Text>
        </View>
      );
    }
    const wrapper = ({ children }) => (
      <ErrorBoundary fallback={<ErrorFallback />}>
        <React.Suspense fallback={null}>
          <SQLiteProvider databaseName="/nonexistent/nonexistent.db" useSuspense>
            {children}
          </SQLiteProvider>
        </React.Suspense>
      </ErrorBoundary>
    );
    const { result } = renderHook(() => useSQLiteContext(), { wrapper });
    await act(async () => {
      await waitFor(() => {
        expect(result).not.toBeNull();
      });
    });
    expect(screen.queryByText(errorText)).not.toBeNull();
  });

  it('should throw when using `onError` and `useSuspense` together', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockErrorHandler = jest.fn();
    render(
      <ErrorBoundary fallback={<View />} onError={mockErrorHandler}>
        <SQLiteProvider
          databaseName="/nonexistent/nonexistent.db"
          onError={mockErrorHandler}
          useSuspense>
          <View />
        </SQLiteProvider>
      </ErrorBoundary>
    );
    await waitFor(() => {
      expect(mockErrorHandler).toHaveBeenCalled();
      expect(mockErrorHandler.mock.calls[0][0].toString()).toMatch(
        /Cannot use `onError` with `useSuspense`, use error boundaries instead./
      );
    });
    consoleErrorSpy.mockRestore();
  });
});
