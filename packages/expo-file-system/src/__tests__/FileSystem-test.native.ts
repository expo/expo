import { mockProperty, unmockProperty } from 'jest-expo';

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
    let downloadResumable;
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
        downloadResumable._uuid,
        options,
        resumeData
      );
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
        downloadResumable._uuid
      );

      unmockProperty(ExponentFileSystem, 'downloadResumablePauseAsync');
    });

    it(`pauses with error`, async () => {
      await expect(downloadResumable.pauseAsync()).rejects.toThrow();
    });

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
        downloadResumable._uuid,
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
