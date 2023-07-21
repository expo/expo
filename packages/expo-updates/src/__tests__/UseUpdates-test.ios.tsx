import { act, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import React from 'react';

import ExpoUpdates from '../ExpoUpdates';
import type { Manifest, UpdatesNativeStateChangeEvent } from '../Updates.types';
import { emitStateChangeEvent } from '../UpdatesEmitter';
import { updateFromManifest } from '../UseUpdatesUtils';
import UseUpdatesTestApp from './UseUpdatesTestApp';

jest.mock('../ExpoUpdates');

describe('useUpdates()', () => {
  describe('Component tests', () => {
    const mockDate = new Date();
    const mockManifest = {
      id: '0000-2222',
      createdAt: mockDate.toISOString(),
      runtimeVersion: '1.0.0',
      launchAsset: {
        url: 'testUrl',
      },
      assets: [],
      metadata: {},
    };
    const mockError = { name: 'UpdatesError', code: 'ERR_TEST', message: 'test message' };
    const isCheckingEvent: UpdatesNativeStateChangeEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRollback: false,
        isRestarting: false,
        isChecking: true,
        isDownloading: false,
      },
    };
    const updateAvailableEvent: UpdatesNativeStateChangeEvent = {
      context: {
        isUpdateAvailable: true,
        isUpdatePending: false,
        isRollback: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        latestManifest: mockManifest,
      },
    };
    const updateUnavailableEvent: UpdatesNativeStateChangeEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRollback: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
      },
    };
    const checkErrorEvent: UpdatesNativeStateChangeEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRollback: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        checkError: mockError,
      },
    };
    const isDownloadingEvent: UpdatesNativeStateChangeEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRollback: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: true,
      },
    };
    const updateDownloadedEvent: UpdatesNativeStateChangeEvent = {
      context: {
        isUpdateAvailable: true,
        isUpdatePending: true,
        isRollback: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        latestManifest: mockManifest,
        downloadedManifest: mockManifest,
      },
    };
    const downloadErrorEvent: UpdatesNativeStateChangeEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRollback: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        downloadError: mockError,
      },
    };

    it('Shows currently running info', async () => {
      await render(<UseUpdatesTestApp />);
      const updateIdView = await screen.findByTestId('currentlyRunning_updateId');
      expect(updateIdView).toHaveTextContent('0000-1111');
      const createdAtView = await screen.findByTestId('currentlyRunning_createdAt');
      expect(createdAtView).toHaveTextContent('2023-03-26T04:58:02.560Z');
      const channelView = await screen.findByTestId('currentlyRunning_channel');
      expect(channelView).toHaveTextContent('main');
    });

    it('Shows available update after receiving state change', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitStateChangeEvent(isCheckingEvent);
      });
      await act(async () => {
        emitStateChangeEvent(updateAvailableEvent);
      });
      const lastCheckForUpdateTime = new Date();
      const updateIdView = await screen.findByTestId('availableUpdate_updateId');
      expect(updateIdView).toHaveTextContent('0000-2222');
      const lastCheckForUpdateTimeView = await screen.findByTestId('lastCheckForUpdateTime');
      expect(lastCheckForUpdateTimeView).toHaveTextContent(
        // truncate the fractional part of the seconds value in the time
        lastCheckForUpdateTime.toISOString().substring(0, 19)
      );
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('true');
    });

    it('Shows no available update after receiving state change', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitStateChangeEvent(isCheckingEvent);
      });
      await act(async () => {
        emitStateChangeEvent(updateUnavailableEvent);
      });
      const updateIdView = await screen.findByTestId('availableUpdate_updateId');
      // No update so text is empty
      expect(updateIdView).toHaveTextContent('');
      const lastCheckForUpdateTime = new Date();
      const lastCheckForUpdateTimeView = await screen.findByTestId('lastCheckForUpdateTime');
      expect(lastCheckForUpdateTimeView).toHaveTextContent(
        // truncate the fractional part of the seconds value in the time
        lastCheckForUpdateTime.toISOString().substring(0, 19)
      );
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
    });

    it('Handles error in checkForUpdate()', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitStateChangeEvent(isCheckingEvent);
      });
      await act(async () => {
        emitStateChangeEvent(checkErrorEvent);
      });
      const errorView = await screen.findByTestId('checkError');
      expect(errorView).toHaveTextContent('test message');
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
    });

    it('Shows downloaded update after receiving state change', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitStateChangeEvent(isDownloadingEvent);
      });
      await act(async () => {
        emitStateChangeEvent(updateDownloadedEvent);
      });
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('true');
      const updateIdView = await screen.findByTestId('downloadedUpdate_updateId');
      expect(updateIdView).toHaveTextContent('0000-2222');
      const isUpdatePendingView = await screen.findByTestId('isUpdatePending');
      expect(isUpdatePendingView).toHaveTextContent('true');
    });

    it('Handles error during downloadUpdate()', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitStateChangeEvent(isDownloadingEvent);
      });
      await act(async () => {
        emitStateChangeEvent(downloadErrorEvent);
      });
      const errorView = await screen.findByTestId('downloadError');
      expect(errorView).toHaveTextContent('test message');
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
      const isUpdatePendingView = await screen.findByTestId('isUpdatePending');
      expect(isUpdatePendingView).toHaveTextContent('false');
    });

    it('Handles error in initial read of native context', async () => {
      ExpoUpdates.getNativeStateMachineContextAsync.mockRejectedValueOnce(new Error('In dev mode'));
      render(<UseUpdatesTestApp />);
      const errorView = await screen.findByTestId('initializationError');
      expect(errorView).toHaveTextContent('In dev mode');
    });
  });

  describe('Test individual methods', () => {
    const mockDate = new Date();
    const manifest: Manifest = {
      id: '0000-2222',
      createdAt: mockDate.toISOString(),
      runtimeVersion: '1.0.0',
      launchAsset: {
        url: 'testUrl',
      },
      assets: [],
      metadata: {},
    };

    it('updateFromManifest() with a manifest', () => {
      const result = updateFromManifest(manifest);
      expect(result?.updateId).toEqual('0000-2222');
      expect(result?.createdAt).toEqual(mockDate);
      expect(result?.manifest).toEqual(manifest);
    });
  });
});
