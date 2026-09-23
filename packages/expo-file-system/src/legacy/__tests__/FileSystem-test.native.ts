import { mockProperty, unmockProperty } from 'jest-expo';
import { Platform } from 'react-native';

import ExponentFileSystem from '../ExponentFileSystem';
import * as FileSystem from '../FileSystem';

describe('FileSystem', () => {
  describe('DownloadResumable', () => {
    const remoteUri = 'http://techslides.com/demos/sample-videos/small.mp4';
    const localUri = FileSystem.documentDirectory + 'small.mp4';
    const options = {};
    const resumeData = '';
    const fakeObject = {
      url: remoteUri,
      fileUri: localUri,
      options,
      resumeData,
    };
    const callback = jest.fn();
    let downloadResumable: FileSystem.DownloadResumable;
    beforeEach(() => {
      downloadResumable = FileSystem.createDownloadResumable(
        remoteUri,
        localUri,
        options,
        callback,
        resumeData
      );
    });

    it(`downloads with the correct props`, async () => {
      await downloadResumable.downloadAsync();

      expect(ExponentFileSystem.downloadResumableStartAsync).toHaveBeenCalledWith(
        remoteUri,
        localUri,
        (downloadResumable as any)._uuid,
        options,
        resumeData
      );
    });

    it('passes the deferred background completion option to native code', async () => {
      const deferredOptions = { deferBackgroundSessionCompletion: true };
      const deferredDownload = FileSystem.createDownloadResumable(
        remoteUri,
        localUri,
        deferredOptions
      );

      await deferredDownload.downloadAsync();

      expect(ExponentFileSystem.downloadResumableStartAsync).toHaveBeenCalledWith(
        remoteUri,
        localUri,
        (deferredDownload as any)._uuid,
        deferredOptions,
        undefined
      );
    });

    it('acknowledges background session completion for the matching download', async () => {
      await downloadResumable.completeBackgroundSessionAsync();

      if (Platform.OS === 'ios') {
        expect(ExponentFileSystem.completeBackgroundSessionAsync).toHaveBeenCalledWith(
          (downloadResumable as any)._uuid
        );
      } else {
        expect(ExponentFileSystem.completeBackgroundSessionAsync).not.toHaveBeenCalled();
      }
    });

    it(`pauses correctly`, async () => {
      mockProperty(
        ExponentFileSystem,
        'downloadResumablePauseAsync',
        jest.fn(async () => fakeObject)
      );

      const downloadPauseState = await downloadResumable.pauseAsync();

      expect(downloadPauseState).toMatchObject(fakeObject);

      expect(ExponentFileSystem.downloadResumablePauseAsync).toHaveBeenCalledWith(
        (downloadResumable as any)._uuid
      );

      unmockProperty(ExponentFileSystem, 'downloadResumablePauseAsync');
    });

    // Disable test – it doesn't make sense since the pause operation doesn't throw with more accurate mocks.
    // it(`pauses with error`, async () => {
    //   await expect(downloadResumable.pauseAsync()).rejects.toThrow();
    // });

    it(`resumes correctly`, async () => {
      mockProperty(
        ExponentFileSystem,
        'downloadResumableStartAsync',
        jest.fn(async () => fakeObject)
      );

      const downloadPauseState = await downloadResumable.resumeAsync();

      expect(downloadPauseState).toMatchObject(fakeObject);

      expect(ExponentFileSystem.downloadResumableStartAsync).toHaveBeenCalledWith(
        remoteUri,
        localUri,
        (downloadResumable as any)._uuid,
        options,
        resumeData
      );
    });

    it(`has same save state as original input`, async () => {
      const downloadPauseState = await downloadResumable.savable();

      expect(downloadPauseState).toMatchObject(fakeObject);
    });
  });
});
