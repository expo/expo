import * as FS from 'expo-file-system';
import * as SMS from 'expo-sms';

async function assertExists(testFile, expectedToExist, expect) {
  const { exists } = await FS.getInfoAsync(testFile.localUri);
  if (expectedToExist) {
    expect(exists).toBeTruthy();
  } else {
    expect(exists).not.toBeTruthy();
  }
}

async function loadAndSaveFle(fileInfo, expect) {
  await FS.deleteAsync(fileInfo.localUri, { idempotent: true });
  await assertExists(fileInfo, false, expect);
  const { md5, headers } = await FS.downloadAsync(fileInfo.remoteUri, fileInfo.localUri, {
    md5: true,
  });
  expect(md5).toBe(fileInfo.md5);
  await assertExists(fileInfo, true, expect);
  expect(headers['Content-Type'] || headers['content-type']).toBe(fileInfo.mimeType);
}

async function cleanupFile(fileInfo, expect) {
  await FS.deleteAsync(fileInfo.localUri);
  await assertExists(fileInfo, false, expect);
}

const pngFile = {
  localUri: FS.documentDirectory + 'image.png',
  remoteUri: 'https://s3-us-west-1.amazonaws.com/test-suite-data/avatar2.png',
  md5: '1e02045c10b8f1145edc7c8375998f87',
  mimeType: 'image/png',
};

const gifFile = {
  localUri: FS.documentDirectory + 'image.gif',
  remoteUri: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif',
  md5: '090592ebd01ac1e425b2766989040f80',
  mimeType: 'image/gif',
};

const audioFile = {
  localUri: FS.documentDirectory + 'sound.mp3',
  remoteUri: 'https://dl.espressif.com/dl/audio/gs-16b-1c-44100hz.mp3',
  md5: 'e21d733c3506280974842f11c6d30005',
  mimeType: 'audio/mpeg',
};

const numbers = ['0123456789', '9876543210'];

export async function testSMSComposeWithSingleImageAttachment(expect) {
  await loadAndSaveFle(pngFile, expect);
  const contentUri = await FS.getContentUriAsync(pngFile.localUri);
  await SMS.sendSMSAsync(numbers, 'test with image', {
    attachments: {
      uri: contentUri,
      mimeType: 'image/png',
      filename: 'image.png',
    },
  });
  await cleanupFile(pngFile, expect);
}

export async function testSMSComposeWithTwoImageAttachments(expect) {
  await loadAndSaveFle(gifFile, expect);
  await loadAndSaveFle(pngFile, expect);
  await SMS.sendSMSAsync(numbers, 'test with two images', {
    attachments: [
      {
        uri: await FS.getContentUriAsync(gifFile.localUri),
        mimeType: 'image/gif',
        filename: 'image.gif',
      },
      {
        uri: await FS.getContentUriAsync(pngFile.localUri),
        mimeType: 'image/png',
        filename: 'image.png',
      },
    ],
  });
  await cleanupFile(gifFile, expect);
  await cleanupFile(pngFile, expect);
}

export async function testSMSComposeWithAudioAttachment(expect) {
  await loadAndSaveFle(audioFile, expect);
  await SMS.sendSMSAsync(numbers, 'test with audio', {
    attachments: [
      {
        uri: await FS.getContentUriAsync(audioFile.localUri),
        mimeType: 'audio/mpeg',
        filename: 'sound.mp3',
      },
    ],
  });
  await cleanupFile(audioFile, expect);
}
