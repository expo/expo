import { act, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import React from 'react';

import UseUpdatesTestApp from './UseUpdatesTestApp';
import type { Manifest, UpdatesNativeStateMachineContext } from '../Updates.types';
import { emitTestStateChangeEvent, resetLatestContext } from '../UpdatesEmitter';
import { updateFromManifest } from '../UseUpdatesUtils';

type UpdatesNativeStateChangeTestEvent = {
  context: UpdatesNativeStateMachineContext & {
    lastCheckForUpdateTimeString?: string;
  };
};

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
    const isCheckingEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRestarting: false,
        isChecking: true,
        isDownloading: false,
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 0,
      },
    };
    const updateAvailableEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: true,
        isUpdatePending: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        latestManifest: mockManifest,
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 1,
      },
    };
    const updateUnavailableEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 1,
      },
    };
    const checkErrorEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        checkError: mockError,
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 1,
      },
    };
    const isDownloadingEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: true,
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 0,
      },
    };
    const updateDownloadedEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: true,
        isUpdatePending: true,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        latestManifest: mockManifest,
        downloadedManifest: mockManifest,
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 1,
      },
    };
    const downloadErrorEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: false,
        isUpdatePending: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        downloadError: mockError,
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 1,
      },
    };
    const updateAvailableWithRollbackEvent: UpdatesNativeStateChangeTestEvent = {
      context: {
        isUpdateAvailable: true,
        isUpdatePending: false,
        isRestarting: false,
        isChecking: false,
        isDownloading: false,
        rollback: {
          commitTime: mockDate.toISOString(),
        },
        lastCheckForUpdateTimeString: mockDate.toISOString(),
        sequenceNumber: 1,
      },
    };

    beforeEach(() => {
      resetLatestContext();
    });

    it('Shows currently running info', async () => {
      await render(<UseUpdatesTestApp />);
      const updateIdView = await screen.findByTestId('currentlyRunning_updateId');
      expect(updateIdView).toHaveTextContent('0000-1111');
      const createdAtView = await screen.findByTestId('currentlyRunning_createdAt');
      expect(createdAtView).toHaveTextContent('2023-03-26T04:58:02.560Z');
      const channelView = await screen.findByTestId('currentlyRunning_channel');
      expect(channelView).toHaveTextContent('main');
    }, 8000);

    it('Shows available update after receiving state change', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitTestStateChangeEvent(isCheckingEvent);
      });
      await act(async () => {
        emitTestStateChangeEvent(updateAvailableEvent);
      });
      const updateIdView = await screen.findByTestId('availableUpdate_updateId');
      expect(updateIdView).toHaveTextContent('0000-2222');
      const lastCheckForUpdateTimeView = await screen.findByTestId('lastCheckForUpdateTime');
      expect(lastCheckForUpdateTimeView).toHaveTextContent(
        // truncate the fractional part of the seconds value in the time
        mockDate.toISOString().substring(0, 19)
      );
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('true');
    });

    it('Shows no available update after receiving state change', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitTestStateChangeEvent(isCheckingEvent);
      });
      await act(async () => {
        emitTestStateChangeEvent(updateUnavailableEvent);
      });
      const updateIdView = await screen.findByTestId('availableUpdate_updateId');
      // No update so text is empty
      expect(updateIdView).toHaveTextContent('');
      const lastCheckForUpdateTimeView = await screen.findByTestId('lastCheckForUpdateTime');
      expect(lastCheckForUpdateTimeView).toHaveTextContent(
        // truncate the fractional part of the seconds value in the time
        mockDate.toISOString().substring(0, 19)
      );
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
    });

    it('Handles error in checkForUpdate()', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitTestStateChangeEvent(isCheckingEvent);
      });
      await act(async () => {
        emitTestStateChangeEvent(checkErrorEvent);
      });
      const errorView = await screen.findByTestId('checkError');
      expect(errorView).toHaveTextContent('test message');
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
    });

    it('Shows downloaded update after receiving state change', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitTestStateChangeEvent(isDownloadingEvent);
      });
      await act(async () => {
        emitTestStateChangeEvent(updateDownloadedEvent);
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
        emitTestStateChangeEvent(isDownloadingEvent);
      });
      await act(async () => {
        emitTestStateChangeEvent(downloadErrorEvent);
      });
      const errorView = await screen.findByTestId('downloadError');
      expect(errorView).toHaveTextContent('test message');
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
      const isUpdatePendingView = await screen.findByTestId('isUpdatePending');
      expect(isUpdatePendingView).toHaveTextContent('false');
    });

    it('Handles rollback', async () => {
      render(<UseUpdatesTestApp />);
      await act(async () => {
        emitTestStateChangeEvent(isCheckingEvent);
      });
      await act(async () => {
        emitTestStateChangeEvent(updateAvailableWithRollbackEvent);
      });
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('true');
      const isUpdatePendingView = await screen.findByTestId('isUpdatePending');
      expect(isUpdatePendingView).toHaveTextContent('false');
      const isRollbackView = await screen.findByTestId('isRollback');
      expect(isRollbackView).toHaveTextContent('true');
      const rollbackTimeView = await screen.findByTestId('rollbackTime');
      expect(rollbackTimeView).toHaveTextContent(
        // truncate the fractional part of the seconds value in the time
        mockDate.toISOString().substring(0, 19)
      );
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
