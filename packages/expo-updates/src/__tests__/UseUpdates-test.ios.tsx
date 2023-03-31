import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import React from 'react';

import * as Updates from '..';
import type { Manifest, UpdateEvent, UseUpdatesCallbacksType } from '..';
import ExpoUpdates from '../ExpoUpdates';
import { availableUpdateFromManifest, updatesInfoFromEvent } from '../UseUpdatesUtils';
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

jest.mock('../ExpoUpdates', () => {
  return {
    nativeDebug: true,
    channel: 'main',
    updateId: '0000-1111',
    commitTime: '2023-03-26T04:58:02.560Z',
    checkForUpdateAsync: jest.fn(),
    fetchUpdateAsync: jest.fn(),
    reload: jest.fn(),
    readLogEntriesAsync: jest.fn(),
  };
});

describe('Updates provider and hook tests', () => {
  describe('Test hook and provider', () => {
    it('App with provider shows currently running info', async () => {
      render(<UseUpdatesTestApp />);
      const updateIdView = await screen.findByTestId('currentlyRunning_updateId');
      expect(updateIdView).toHaveTextContent('0000-1111');
      const createdAtView = await screen.findByTestId('currentlyRunning_createdAt');
      expect(createdAtView).toHaveTextContent('2023-03-26T04:58:02.560Z');
      const channelView = await screen.findByTestId('currentlyRunning_channel');
      expect(channelView).toHaveTextContent('main');
    });

    it('App with provider shows available update after running checkForUpdate()', async () => {
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
      ExpoUpdates.checkForUpdateAsync.mockReturnValueOnce({
        isAvailable: true,
        manifest: mockManifest,
      });
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

    it('App with provider shows no available update after running checkForUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      ExpoUpdates.checkForUpdateAsync.mockReturnValueOnce({
        isAvailable: false,
      });
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

    it('App with provider handles error in checkForUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      ExpoUpdates.checkForUpdateAsync.mockRejectedValueOnce(mockError);
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

    it('App with provider calls callbacks during downloadUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      ExpoUpdates.fetchUpdateAsync.mockReturnValueOnce({
        isNew: true,
        manifestString: '{"name": "test"}',
      });
      const buttonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      expect(callbacks.onDownloadUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onDownloadUpdateComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.onDownloadUpdateError).not.toHaveBeenCalled();
    });

    it('App with provider handles error during downloadUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      ExpoUpdates.fetchUpdateAsync.mockRejectedValueOnce(mockError);
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

    it('App with provider calls callbacks during downloadAndRunUpdate()', async () => {
      const callbacks = getCallbacks();
      render(<UseUpdatesTestApp callbacks={callbacks} />);
      ExpoUpdates.fetchUpdateAsync.mockReturnValueOnce({
        isNew: true,
        manifestString: '{"name": "test"}',
      });
      ExpoUpdates.reload.mockReturnValueOnce('');
      const buttonView = await screen.findByTestId('downloadAndRunUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      expect(callbacks.onDownloadUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onDownloadUpdateComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.onDownloadUpdateError).not.toHaveBeenCalled();
      expect(callbacks.onRunUpdateStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onRunUpdateError).not.toHaveBeenCalled();
    });

    it('App with provider shows log entries after running readLogEntries()', async () => {
      ExpoUpdates.readLogEntriesAsync.mockReturnValueOnce([
        {
          timestamp: 100,
          message: 'Message 1',
          code: UpdatesLogEntryCode.NONE,
          level: UpdatesLogEntryLevel.INFO,
        },
      ]);
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

    it('updatesInfoFromEvent() returns mutated info as expected', () => {
      // Available
      let event: UpdateEvent = {
        type: UpdateEventType.UPDATE_AVAILABLE,
        manifest,
      };
      let updatesInfo = updatesInfoFromEvent(undefined, event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate?.updateId).toEqual('0000-2222');
      expect(updatesInfo.error).toBeUndefined();
      // Not available
      event = { type: UpdateEventType.NO_UPDATE_AVAILABLE };
      updatesInfo = updatesInfoFromEvent(updatesInfo, event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate).toBeUndefined();
      expect(updatesInfo.error).toBeUndefined();
      // Error
      event = { type: UpdateEventType.ERROR, message: 'It broke' };
      updatesInfo = updatesInfoFromEvent(updatesInfo, event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate).toBeUndefined();
      expect(updatesInfo.error?.message).toEqual('It broke');
      // Back to available
      event = {
        type: UpdateEventType.UPDATE_AVAILABLE,
        manifest,
      };
      updatesInfo = updatesInfoFromEvent(undefined, event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate?.updateId).toEqual('0000-2222');
      updatesInfo = updatesInfoFromEvent(undefined, event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate?.updateId).toEqual('0000-2222');
      expect(updatesInfo.error).toBeUndefined();
    });
  });
});
