import aws from 'aws-sdk';

import { Platform } from '../ProjectVersions';

export { Platform };

export type S3Client = aws.S3;

export interface ClientBuilder {
  platform: Platform;
  getAppPath: () => string;
  getClientUrl: (appVersion: string) => string;
  getAppVersionAsync: () => Promise<string>;
  buildAsync: (flavor?: ClientBuildFlavor) => Promise<void>;
  uploadBuildAsync: (s3Client: S3Client, appVersion: string) => Promise<void>;
}

export enum ClientBuildFlavor {
  VERSIONED = 'versioned',
  UNVERSIONED = 'unversioned',
}
