import fs from 'fs-extra';
// @ts-ignore
import Jimp from 'jimp-compact';
import fetch from 'node-fetch';
import path from 'path';
import stream from 'stream';
import temporary from 'tempy';
import util from 'util';

// cache downloaded images into memory
const cacheDownloadedKeys: Record<string, string> = {};

function stripQueryParams(url: string): string {
  return url.split('?')[0].split('#')[0];
}

export async function downloadOrUseCachedImage(url: string): Promise<string> {
  if (url in cacheDownloadedKeys) {
    return cacheDownloadedKeys[url];
  }
  if (url.startsWith('http')) {
    cacheDownloadedKeys[url] = await downloadImage(url);
  } else {
    cacheDownloadedKeys[url] = url;
  }
  return cacheDownloadedKeys[url];
}

export async function downloadImage(url: string): Promise<string> {
  const outputPath = temporary.directory();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`It was not possible to download image from '${url}'`);
  }

  // Download to local file
  const streamPipeline = util.promisify(stream.pipeline);
  const localPath = path.join(outputPath, path.basename(stripQueryParams(url)));
  await streamPipeline(response.body, fs.createWriteStream(localPath));

  // If an image URL doesn't have a name, get the mime type and move the file.
  const img = await Jimp.read(localPath);
  const mime = img.getMIME().split('/').pop()!;
  if (!localPath.endsWith(mime)) {
    const newPath = path.join(outputPath, `image.${mime}`);
    await fs.move(localPath, newPath);
    return newPath;
  }

  return localPath;
}
