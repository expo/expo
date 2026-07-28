/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Socket } from 'net';

import { ResponseError, ServiceClient } from './ServiceClient';
import { LockdownProtocolClient } from '../protocol/LockdownProtocol';
import type { LockdownCommand, LockdownResponse } from '../protocol/LockdownProtocol';

export type OnInstallProgressCallback = (props: {
  status: string;
  isComplete: boolean;
  // copiedFiles: number;
  progress: number;
}) => void;

interface IPOptions {
  ApplicationsType?: 'Any';
  PackageType?: 'Developer';
  CFBundleIdentifier?: string;

  ReturnAttributes?: (
    | 'CFBundleIdentifier'
    | 'ApplicationDSID'
    | 'ApplicationType'
    | 'CFBundleExecutable'
    | 'CFBundleDisplayName'
    | 'CFBundleIconFile'
    | 'CFBundleName'
    | 'CFBundleShortVersionString'
    | 'CFBundleSupportedPlatforms'
    | 'CFBundleURLTypes'
    | 'CodeInfoIdentifier'
    | 'Container'
    | 'Entitlements'
    | 'HasSettingsBundle'
    | 'IsUpgradeable'
    | 'MinimumOSVersion'
    | 'Path'
    | 'SignerIdentity'
    | 'UIDeviceFamily'
    | 'UIFileSharingEnabled'
    | 'UIStatusBarHidden'
    | 'UISupportedInterfaceOrientations'
  )[];
  BundleIDs?: string[];
  [key: string]: undefined | string | string[];
}

interface IPInstallPercentCompleteResponseItem extends LockdownResponse {
  PercentComplete: number;
}

interface IPInstallCFBundleIdentifierResponseItem {
  CFBundleIdentifier: string;
}

interface IPInstallCompleteResponseItem extends LockdownResponse {
  Status: 'Complete';
}
/*
 *  [{ "PercentComplete": 5, "Status": "CreatingStagingDirectory" }]
 *  ...
 *  [{ "PercentComplete": 90, "Status": "GeneratingApplicationMap" }]
 *  [{ "CFBundleIdentifier": "my.company.app" }]
 *  [{ "Status": "Complete" }]
 */
type IPInstallPercentCompleteResponse = IPInstallPercentCompleteResponseItem[];
type IPInstallCFBundleIdentifierResponse = IPInstallCFBundleIdentifierResponseItem[];
type IPInstallCompleteResponse = IPInstallCompleteResponseItem[];

interface IPMessage extends LockdownCommand {
  Command: string;
  ClientOptions: IPOptions;
}

interface IPLookupResponseItem extends LockdownResponse {
  LookupResult: IPLookupResult;
}
/*
 * [{
 *    LookupResult: IPLookupResult,
 *    Status: "Complete"
 *  }]
 */
type IPLookupResponse = IPLookupResponseItem[];

export interface IPLookupResult {
  // BundleId
  [key: string]: {
    Container: string;
    CFBundleIdentifier: string;
    CFBundleExecutable: string;
    Path: string;
  };
}

function isIPLookupResponse(resp: any): resp is IPLookupResponse {
  return resp.length && resp[0].LookupResult !== undefined;
}

function isIPInstallPercentCompleteResponse(resp: any): resp is IPInstallPercentCompleteResponse {
  return resp.length && resp[0].PercentComplete !== undefined;
}

function isIPInstallCFBundleIdentifierResponse(
  resp: any
): resp is IPInstallCFBundleIdentifierResponse {
  return resp.length && resp[0].CFBundleIdentifier !== undefined;
}

function isIPInstallCompleteResponse(resp: any): resp is IPInstallCompleteResponse {
  return resp.length && resp[0].Status === 'Complete';
}

export class InstallationProxyClient extends ServiceClient<LockdownProtocolClient<IPMessage>> {
  constructor(public socket: Socket) {
    super(socket, new LockdownProtocolClient(socket));
  }

  async lookupApp(
    bundleIds: string[],
    options: IPOptions = {
      ReturnAttributes: ['Path', 'Container', 'CFBundleExecutable', 'CFBundleIdentifier'],
      ApplicationsType: 'Any',
    }
  ) {
    let resp = await this.protocolClient.sendMessage({
      Command: 'Lookup',
      ClientOptions: {
        BundleIDs: bundleIds,
        ...options,
      },
    });
    if (resp && !Array.isArray(resp)) resp = [resp];
    if (isIPLookupResponse(resp)) {
      return resp[0]?.LookupResult;
    } else {
      throw new ResponseError(`There was an error looking up app`, resp);
    }
  }

  async installApp(
    packagePath: string,
    bundleId: string,
    options: IPOptions = {
      ApplicationsType: 'Any',
      PackageType: 'Developer',
    },
    onProgress: OnInstallProgressCallback
  ) {
    return this.protocolClient.sendMessage(
      {
        Command: 'Install',
        PackagePath: packagePath,
        ClientOptions: {
          CFBundleIdentifier: bundleId,
          ...options,
        },
      },
      (resp, resolve, reject) => {
        if (resp && !Array.isArray(resp)) resp = [resp];

        if (isIPInstallCompleteResponse(resp)) {
          onProgress({
            isComplete: true,
            progress: 100,
            status: resp[0]!.Status,
          });
          resolve();
        } else if (isIPInstallPercentCompleteResponse(resp)) {
          onProgress({
            isComplete: false,
            progress: resp[0]!.PercentComplete,
            status: resp[0]!.Status,
          });
        } else if (isIPInstallCFBundleIdentifierResponse(resp)) {
        } else {
          reject(
            new ResponseError(
              'There was an error installing app: ' + require('util').inspect(resp),
              resp
            )
          );
        }
      }
    );
  }
}
