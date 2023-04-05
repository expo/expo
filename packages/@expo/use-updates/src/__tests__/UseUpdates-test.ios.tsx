import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Updates from 'expo-updates';
import type { Manifest, UpdateCheckResult, UpdateEvent, UpdatesLogEntry } from 'expo-updates';
import '@testing-library/jest-native/extend-expect';
import React from 'react';

import type { UseUpdatesCallbacksType } from '../UseUpdates.types';
import { availableUpdateFromManifest, availableUpdateFromEvent } from '../UseUpdatesUtils';
import UseUpdatesTestApp from './UseUpdatesTestApp';

const { UpdatesLogEntryCode, UpdatesLogEntryLevel, UpdateEventType } = Updates;

const getCallbacks: () => UseUpdatesCallbacksType = () => {
  return {
    onCheckForUpdateComplete: jest.fn(),
    onCheckForUpdateError: jest.fn(),
    onCheckForUpdateStart: jest.fn(),
    onDownloadUpdateComplete: jest.fn(),
    onDownloadUpdateError: jest.fn(),
    onDownloadUpdateStart: jest.fn(),
    onRunUpdateError: jest.fn(),
    onRunUpdateStart: jest.fn(),
  };
};

jest.mock('expo-updates', () => {
  return {
    ...jest.requireActual('expo-updates'),
    channel: 'main',
    updateId: '0000-1111',
    createdAt: new Date('2023-03-26T04:58:02.560Z'),
    checkForUpdateAsync: jest.fn(),
    fetchUpdateAsync: jest.fn(),
    reload: jest.fn(),
    readLogEntriesAsync: jest.fn(),
    useUpdateEvents: jest.fn(),
  };
});

describe('useUpdates()', () => {
  describe('Component tests', () => {
    it('Shows currently running info', async () => {
      render(<UseUpdatesTestApp />);
      const updateIdView = await screen.findByTestId('currentlyRunning_updateId');
      expect(updateIdView).toHaveTextContent('0000-1111');
      const createdAtView = await screen.findByTestId('currentlyRunning_createdAt');
      expect(createdAtView).toHaveTextContent('2023-03-26T04:58:02.560Z');
      const channelView = await screen.findByTestId('currentlyRunning_channel');
      expect(channelView).toHaveTextContent('main');
    });

    it('Shows available update after running checkForUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
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
      const mockResponse: UpdateCheckResult = {
        isAvailable: true,
        isRollBackToEmbedded: false,
        manifest: mockManifest,
      };
      jest.spyOn(Updates, 'checkForUpdateAsync').mockResolvedValueOnce(mockResponse);
      const buttonView = await screen.findByTestId('checkForUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const lastCheckForUpdateTime = new Date();
      const updateIdView = await screen.findByTestId('availableUpdate_updateId');
      expect(updateIdView).toHaveTextContent('0000-2222');
      const lastCheckForUpdateTimeView = await screen.findByTestId('lastCheckForUpdateTime');
      expect(lastCheckForUpdateTimeView).toHaveTextContent(
        // truncate the fractional part of the seconds value in the time
        lastCheckForUpdateTime.toISOString().substring(0, 19)
      );
      expect(callbacks.onCheckForUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onCheckForUpdateComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.onCheckForUpdateError).not.toHaveBeenCalled();
    });

    it('Shows available update after UpdateEvent fired', async () => {
      let mockListener: any = null;
      jest.spyOn(Updates, 'useUpdateEvents').mockImplementation((listener) => {
        mockListener = listener;
      });

      render(<UseUpdatesTestApp />);
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
      const mockEvent: UpdateEvent = {
        type: UpdateEventType.UPDATE_AVAILABLE,
        manifest: mockManifest,
      };

      await act(async () => {
        mockListener(mockEvent);
      });
      const lastCheckForUpdateTime = new Date();
      const updateIdView = await screen.findByTestId('availableUpdate_updateId');
      expect(updateIdView).toHaveTextContent('0000-2222');
      const lastCheckForUpdateTimeView = await screen.findByTestId('lastCheckForUpdateTime');
      expect(lastCheckForUpdateTimeView).toHaveTextContent(
        // truncate the fractional part of the seconds value in the time
        lastCheckForUpdateTime.toISOString().substring(0, 19)
      );
    });

    it('Shows no available update after running checkForUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      const mockResponse: UpdateCheckResult = {
        isAvailable: false,
        isRollBackToEmbedded: false,
        manifest: undefined,
      };
      jest.spyOn(Updates, 'checkForUpdateAsync').mockResolvedValueOnce(mockResponse);
      const buttonView = await screen.findByTestId('checkForUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
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
      expect(callbacks.onCheckForUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onCheckForUpdateComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.onCheckForUpdateError).not.toHaveBeenCalled();
    });

    it('Handles error in checkForUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      jest.spyOn(Updates, 'checkForUpdateAsync').mockRejectedValueOnce(mockError);
      const buttonView = await screen.findByTestId('checkForUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const errorView = await screen.findByTestId('error');
      expect(errorView).toHaveTextContent('{"code":"ERR_TEST","message":"test message"}');
      expect(callbacks.onCheckForUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onCheckForUpdateComplete).not.toHaveBeenCalled();
      expect(callbacks.onCheckForUpdateError).toHaveBeenCalledWith(mockError);
    });

    it('Calls callbacks during downloadUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      const mockResponse: any = {
        isNew: true,
        manifest: { name: 'test' },
      };
      jest.spyOn(Updates, 'fetchUpdateAsync').mockResolvedValueOnce(mockResponse);
      const buttonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      expect(callbacks.onDownloadUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onDownloadUpdateComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.onDownloadUpdateError).not.toHaveBeenCalled();
    });

    it('Handles error during downloadUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      jest.spyOn(Updates, 'fetchUpdateAsync').mockRejectedValueOnce(mockError);
      const buttonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const errorView = await screen.findByTestId('error');
      expect(errorView).toHaveTextContent('{"code":"ERR_TEST","message":"test message"}');
      expect(callbacks.onDownloadUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onDownloadUpdateComplete).not.toHaveBeenCalled();
      expect(callbacks.onDownloadUpdateError).toHaveBeenCalledWith(mockError);
    });

    it('Shows log entries after running readLogEntries()', async () => {
      const logEntry: UpdatesLogEntry = {
        timestamp: 100,
        message: 'Message 1',
        code: UpdatesLogEntryCode.NONE,
        level: UpdatesLogEntryLevel.INFO,
      };
      jest.spyOn(Updates, 'readLogEntriesAsync').mockResolvedValueOnce([logEntry]);
      render(<UseUpdatesTestApp />);
      const buttonView = await screen.findByTestId('readLogEntries');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const logEntryView = await screen.findByTestId('logEntry');
      expect(logEntryView).toHaveTextContent('Message 1');
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

    it('availableUpdateFromManifest() with a manifest', () => {
      const result = availableUpdateFromManifest(manifest);
      expect(result?.updateId).toEqual('0000-2222');
      expect(result?.createdAt).toEqual(mockDate);
      expect(result?.manifest).toEqual(manifest);
    });

    it('availableUpdateFromManifest() with undefined manifest', () => {
      const result = availableUpdateFromManifest(undefined);
      expect(result).toBeUndefined();
    });

    it('availableUpdateFromEvent() returns info for UPDATE_AVAILABLE', () => {
      const event: UpdateEvent = {
        type: UpdateEventType.UPDATE_AVAILABLE,
        manifest,
      };
      const result = availableUpdateFromEvent(event);
      expect(result.availableUpdate?.updateId).toEqual('0000-2222');
      expect(result.error).toBeUndefined();
    });

    it('availableUpdateFromEvent() returns info for NO_UPDATE_AVAILABLE', () => {
      const event = { type: UpdateEventType.NO_UPDATE_AVAILABLE };
      const result = availableUpdateFromEvent(event);
      expect(result.availableUpdate).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('availableUpdateFromEvent() returns info for ERROR', () => {
      const event = { type: UpdateEventType.ERROR, message: 'It broke' };
      const result = availableUpdateFromEvent(event);
      expect(result.availableUpdate).toBeUndefined();
      expect(result.error?.message).toEqual('It broke');
    });
  });
});
