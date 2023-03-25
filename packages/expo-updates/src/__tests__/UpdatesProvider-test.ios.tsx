import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import React from 'react';

import * as Updates from '..';
import type { Manifest, UpdateEvent } from '..';
import ExpoUpdates from '../ExpoUpdates';
import {
  checkForUpdate,
  downloadUpdate,
  downloadAndRunUpdate,
  runUpdate,
  readLogEntries,
} from '../UpdatesProvider';
import { availableUpdateFromManifest, updatesInfoFromEvent } from '../UpdatesProvider.utils';
import { UpdatesProviderTestApp } from './UpdatesProviderTestApp';

const { UpdatesLogEntryCode, UpdatesLogEntryLevel, UpdateEventType } = Updates;
const { UpdatesProvider } = Updates.Provider;

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
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp />
        </UpdatesProvider>
      );
      const updateIdView = await screen.findByTestId('currentlyRunning_updateId');
      expect(updateIdView).toHaveTextContent('0000-1111');
      const createdAtView = await screen.findByTestId('currentlyRunning_createdAt');
      expect(createdAtView).toHaveTextContent('2023-03-26T04:58:02.560Z');
      const channelView = await screen.findByTestId('currentlyRunning_channel');
      expect(channelView).toHaveTextContent('main');
    });

    it('App with provider shows available update after running checkForUpdate()', async () => {
      const providerEventHandler = jest.fn();
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp providerEventHandler={providerEventHandler} />
        </UpdatesProvider>
      );
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
      expect(providerEventHandler).toHaveBeenCalledTimes(2);
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.CHECK_START,
      });
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.CHECK_COMPLETE,
      });
    });

    it('App with provider shows no available update after running checkForUpdate()', async () => {
      const providerEventHandler = jest.fn();
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp providerEventHandler={providerEventHandler} />
        </UpdatesProvider>
      );
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
      expect(providerEventHandler).toHaveBeenCalledTimes(2);
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.CHECK_START,
      });
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.CHECK_COMPLETE,
      });
    });

    it('App with provider handles error in checkForUpdate()', async () => {
      const providerEventHandler = jest.fn();
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp providerEventHandler={providerEventHandler} />
        </UpdatesProvider>
      );
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      ExpoUpdates.checkForUpdateAsync.mockRejectedValueOnce(mockError);
      const buttonView = await screen.findByTestId('checkForUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const errorView = await screen.findByTestId('error');
      expect(errorView).toHaveTextContent('{"code":"ERR_TEST","message":"test message"}');
      expect(providerEventHandler).toHaveBeenCalledTimes(2);
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.CHECK_START,
      });
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.CHECK_ERROR,
        error: mockError,
      });
    });

    it('App with provider calls handler during downloadUpdate()', async () => {
      const providerEventHandler = jest.fn();
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp providerEventHandler={providerEventHandler} />
        </UpdatesProvider>
      );
      ExpoUpdates.fetchUpdateAsync.mockReturnValueOnce({
        isNew: true,
        manifestString: '{"name": "test"}',
      });
      const buttonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      expect(providerEventHandler).toHaveBeenCalledTimes(2);
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.DOWNLOAD_START,
      });
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.DOWNLOAD_COMPLETE,
      });
    });

    it('App with provider handles error during downloadUpdate()', async () => {
      const providerEventHandler = jest.fn();
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp providerEventHandler={providerEventHandler} />
        </UpdatesProvider>
      );
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      ExpoUpdates.fetchUpdateAsync.mockRejectedValueOnce(mockError);
      const buttonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const errorView = await screen.findByTestId('error');
      expect(errorView).toHaveTextContent('{"code":"ERR_TEST","message":"test message"}');
      expect(providerEventHandler).toHaveBeenCalledTimes(2);
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.DOWNLOAD_START,
      });
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.DOWNLOAD_ERROR,
        error: mockError,
      });
    });

    it('App with provider calls handler during downloadAndRunUpdate()', async () => {
      const providerEventHandler = jest.fn();
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp providerEventHandler={providerEventHandler} />
        </UpdatesProvider>
      );
      ExpoUpdates.fetchUpdateAsync.mockReturnValueOnce({
        isNew: true,
        manifestString: '{"name": "test"}',
      });
      ExpoUpdates.reload.mockReturnValueOnce('');
      const buttonView = await screen.findByTestId('downloadAndRunUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      expect(providerEventHandler).toHaveBeenCalledTimes(3);
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.DOWNLOAD_START,
      });
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.DOWNLOAD_COMPLETE,
      });
      expect(providerEventHandler).toHaveBeenCalledWith({
        type: Updates.UpdatesProviderEventType.RUN_START,
      });
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
      render(
        <UpdatesProvider>
          <UpdatesProviderTestApp />
        </UpdatesProvider>
      );
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

    it('updatesInfoFromEvent() when update is available', () => {
      const event: UpdateEvent = {
        type: UpdateEventType.UPDATE_AVAILABLE,
        manifest,
      };
      const updatesInfo = updatesInfoFromEvent(event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate?.updateId).toEqual('0000-2222');
    });

    it('updatesInfoFromEvent() when update is not available', () => {
      const event: UpdateEvent = {
        type: UpdateEventType.NO_UPDATE_AVAILABLE,
      };
      const updatesInfo = updatesInfoFromEvent(event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate).toBeUndefined();
      expect(updatesInfo.error).toBeUndefined();
    });

    it('updatesInfoFromEvent() when an error occurs', () => {
      const event: UpdateEvent = {
        type: UpdateEventType.ERROR,
        message: 'It broke',
      };
      const updatesInfo = updatesInfoFromEvent(event);
      expect(updatesInfo.currentlyRunning.updateId).toEqual('0000-1111');
      expect(updatesInfo.availableUpdate).toBeUndefined();
      expect(updatesInfo.error?.message).toEqual('It broke');
    });
  });

  describe('Directly imported methods should throw', () => {
    const testThatMethodThrows = (testMethod: () => void) => {
      let mockError = null;
      const method = () => {
        try {
          testMethod();
        } catch (error) {
          mockError = error;
        }
      };
      method();
      expect(mockError).not.toBeNull();
    };
    it('checkForUpdate', () => {
      testThatMethodThrows(checkForUpdate);
    });

    it('downloadUpdate', () => {
      testThatMethodThrows(downloadUpdate);
    });

    it('downloadAndRunUpdate', () => {
      testThatMethodThrows(downloadAndRunUpdate);
    });

    it('runUpdate', () => {
      testThatMethodThrows(runUpdate);
    });

    it('readLogEntries', () => {
      testThatMethodThrows(readLogEntries);
    });
  });
});
