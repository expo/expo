// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy — "native platforms via
// launch.expo.dev". One launch: pack the project source, upload it as the signed-in user, hand back
// the URL that finishes the job in a browser.
//
// The browser step is not a failure and not an afterthought: signing, store accounts and
// submission need a person, so the URL *is* the result of this command.

import fs from 'fs';
import { iterableToStream, tar, TarFile } from 'multitars';
import { Readable } from 'stream';

import * as Log from '../log';
import { event } from './events';
import type { LaunchAuth } from './launchAuth';
import {
  assertUploadableOrThrow,
  formatByteSize,
  listUploadFilesAsync,
  summarizeUploadAsync,
  type UploadFile,
} from './launchFiles';
import { createLaunchAsync } from './launchUpload';
import type { LaunchDeployResult } from './types';

/**
 * Directory every entry of the tarball lives under, as the reference implementation writes it
 * (`create-launch`): the service unpacks `project/`, and `x-project-root` is resolved inside it.
 */
const TAR_ROOT = 'project';

/**
 * How long the launch URL stays open, in hours.
 *
 * The service does not return an expiry, so this is the documented lifetime of a launch rather than
 * a value read from the response — it is here, once, so the two places that print it cannot drift.
 */
export const LAUNCH_LINK_EXPIRY_HOURS = 8;

export interface LaunchProjectOptions {
  auth: LaunchAuth;
  /** Directory whose contents are uploaded. */
  uploadRoot: string;
  /**
   * Path of the app inside the upload, posix separated, for a monorepo. Undefined when the upload
   * root is the project itself.
   */
  projectPath?: string;
  /** The command owns stdout, so progress is not printed. */
  json: boolean;
}

/** Upload the project source and return the launch the service created. */
export async function launchProjectAsync(
  options: LaunchProjectOptions
): Promise<LaunchDeployResult> {
  const summary = await summarizeUploadAsync(options.uploadRoot);
  assertUploadableOrThrow(summary, options.uploadRoot);

  if (!options.json) {
    Log.log(
      `Uploading ${summary.files} files (${formatByteSize(summary.size)}) from ${options.uploadRoot}`
    );
  }

  const launch = await createLaunchAsync({
    auth: options.auth,
    body: createUploadBody(options.uploadRoot),
    projectRoot: options.projectPath,
  });

  event('launch', {
    id: launch.id,
    url: launch.url,
    framework: launch.framework,
    files: summary.files,
    size: summary.size,
  });

  return {
    id: launch.id,
    url: launch.url,
    framework: launch.framework,
    expiresInHours: LAUNCH_LINK_EXPIRY_HOURS,
    upload: summary,
  };
}

/**
 * The request body: the project source as a gzipped tarball, streamed.
 *
 * Streamed rather than written to a temporary file, because a project is up to 500 MB and the
 * upload is the slow part of the command — the first bytes leave while the last files are still
 * being read.
 */
function createUploadBody(uploadRoot: string): ReadableStream<Uint8Array> {
  const files = toTarFiles(listUploadFilesAsync(uploadRoot));
  return iterableToStream(tar(files)).pipeThrough(
    new CompressionStream('gzip')
  ) as ReadableStream<Uint8Array>;
}

/** Turn the listed files into tar entries, each one read as it is written into the archive. */
async function* toTarFiles(files: AsyncGenerator<UploadFile>): AsyncGenerator<TarFile> {
  for await (const file of files) {
    // `Readable.toWeb` is typed for a shared buffer too, which a file read never produces.
    const stream = Readable.toWeb(fs.createReadStream(file.path)) as ReadableStream<
      Uint8Array<ArrayBuffer>
    >;
    yield TarFile.from(stream, `${TAR_ROOT}/${file.normalizedPath}`, { size: file.size });
  }
}
