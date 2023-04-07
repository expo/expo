import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Updates from 'expo-updates';
import type { Manifest, UpdateCheckResult, UpdatesLogEntry } from 'expo-updates';
import '@testing-library/jest-native/extend-expect';
import React from 'react';

import { UseUpdatesEvent, UseUpdatesEventType } from '..';
import { availableUpdateFromManifest, availableUpdateFromEvent } from '../UseUpdatesUtils';
import UseUpdatesTestApp from './UseUpdatesTestApp';

const { UpdatesLogEntryCode, UpdatesLogEntryLevel } = Updates;

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
      const eventListener = jest.fn();
      render(<UseUpdatesTestApp eventListener={eventListener} />);
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
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('true');
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.UPDATE_AVAILABLE,
        manifest: mockManifest,
      });
    });

    it('Shows no available update after running checkForUpdate()', async () => {
      const eventListener = jest.fn();
      render(<UseUpdatesTestApp eventListener={eventListener} />);
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
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.NO_UPDATE_AVAILABLE,
      });
    });

    it('Handles error in checkForUpdate()', async () => {
      const eventListener = jest.fn();
      render(<UseUpdatesTestApp eventListener={eventListener} />);
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      jest.spyOn(Updates, 'checkForUpdateAsync').mockRejectedValueOnce(mockError);
      const buttonView = await screen.findByTestId('checkForUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const errorView = await screen.findByTestId('error');
      expect(errorView).toHaveTextContent('test message');
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.ERROR,
        error: mockError,
      });
    });

    it('downloadUpdate() succeeds when manifest included in event', async () => {
      const eventListener = jest.fn();
      render(<UseUpdatesTestApp eventListener={eventListener} />);
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
      const mockDownloadResponse: any = {
        isNew: true,
        manifest: mockManifest,
      };
      jest.spyOn(Updates, 'fetchUpdateAsync').mockResolvedValueOnce(mockDownloadResponse);
      const buttonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('true');
      const isUpdatePendingView = await screen.findByTestId('isUpdatePending');
      expect(isUpdatePendingView).toHaveTextContent('true');
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.DOWNLOAD_START,
      });
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.DOWNLOAD_COMPLETE,
      });
    });

    it('downloadUpdate() succeeds when manifest not included in event, checkForUpdate has already run successfully', async () => {
      const eventListener = jest.fn();
      render(<UseUpdatesTestApp eventListener={eventListener} />);
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
      const mockCheckResponse: UpdateCheckResult = {
        isAvailable: true,
        isRollBackToEmbedded: false,
        manifest: mockManifest,
      };
      const mockDownloadResponse: any = {
        isNew: false,
      };
      jest.spyOn(Updates, 'checkForUpdateAsync').mockResolvedValueOnce(mockCheckResponse);
      jest.spyOn(Updates, 'fetchUpdateAsync').mockResolvedValueOnce(mockDownloadResponse);
      const checkButtonView = await screen.findByTestId('checkForUpdate');
      await act(async () => {
        fireEvent(checkButtonView, 'press');
      });
      const downloadButtonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(downloadButtonView, 'press');
      });
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('true');
      const isUpdatePendingView = await screen.findByTestId('isUpdatePending');
      expect(isUpdatePendingView).toHaveTextContent('true');
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.DOWNLOAD_START,
      });
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.DOWNLOAD_COMPLETE,
      });
    });

    it('Handles error during downloadUpdate()', async () => {
      const eventListener = jest.fn();
      render(<UseUpdatesTestApp eventListener={eventListener} />);
      const mockError = { code: 'ERR_TEST', message: 'test message' };
      jest.spyOn(Updates, 'fetchUpdateAsync').mockRejectedValueOnce(mockError);
      const buttonView = await screen.findByTestId('downloadUpdate');
      await act(async () => {
        fireEvent(buttonView, 'press');
      });
      const errorView = await screen.findByTestId('error');
      expect(errorView).toHaveTextContent('test message');
      const isUpdateAvailableView = await screen.findByTestId('isUpdateAvailable');
      expect(isUpdateAvailableView).toHaveTextContent('false');
      const isUpdatePendingView = await screen.findByTestId('isUpdatePending');
      expect(isUpdatePendingView).toHaveTextContent('false');
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.DOWNLOAD_START,
      });
      expect(eventListener).toHaveBeenCalledWith({
        type: UseUpdatesEventType.ERROR,
        error: mockError,
      });
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
      const event: UseUpdatesEvent = {
        type: UseUpdatesEventType.UPDATE_AVAILABLE,
        manifest,
      };
      const result = availableUpdateFromEvent(event);
      expect(result.availableUpdate?.updateId).toEqual('0000-2222');
      expect(result.error).toBeUndefined();
    });

    it('availableUpdateFromEvent() returns info for NO_UPDATE_AVAILABLE', () => {
      const event = { type: UseUpdatesEventType.NO_UPDATE_AVAILABLE };
      const result = availableUpdateFromEvent(event);
      expect(result.availableUpdate).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('availableUpdateFromEvent() returns info for ERROR', () => {
      const event = { type: UseUpdatesEventType.ERROR, error: new Error('It broke') };
      const result = availableUpdateFromEvent(event);
      expect(result.availableUpdate).toBeUndefined();
      expect(result.error?.message).toEqual('It broke');
    });
  });
});
