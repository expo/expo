import Debug from 'debug';
import { readFileSync } from 'fs';
import { boolish } from 'getenv';
import * as path from 'path';

import {
  AFC_STATUS,
  AFCError,
  ClientManager,
  LockdowndClient,
  OnInstallProgressCallback,
  UsbmuxdClient,
} from './native-run/ios/lib';
import type { DeviceValues, IPLookupResult } from './native-run/ios/lib';
import { getDeveloperDiskImagePath } from './native-run/ios/utils/xcode';
import { onBeforeExit, wait } from './native-run/utils/process';

const EXPO_USE_APPLE_DEVICE = boolish('EXPO_USE_APPLE_DEVICE', false);

const debug = Debug('expo:ios:utils:device');

export function isEnabled() {
  return EXPO_USE_APPLE_DEVICE;
}

export async function getConnectedDevices(): Promise<DeviceValues[]> {
  const usbmuxClient = new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket());
  const usbmuxDevices = await usbmuxClient.getDevices();
  usbmuxClient.socket.end();

  return Promise.all(
    usbmuxDevices.map(async (d: any): Promise<DeviceValues> => {
      const socket = await new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket()).connect(
        d,
        62078
      );
      const device = await new LockdowndClient(socket).getAllValues();
      socket.end();
      return device;
    })
  );
}

export async function runOnDevice({
  udid,
  appPath,
  bundleId,
  waitForApp,
  deltaPath,
  onProgress,
}: {
  udid: string;
  appPath: string;
  bundleId: string;
  waitForApp: boolean;
  deltaPath: string;
  onProgress: OnInstallProgressCallback;
}) {
  const clientManager = await ClientManager.create(udid);

  try {
    await mountDeveloperDiskImage(clientManager);

    const packageName = path.basename(appPath);
    const destPackagePath = path.join('PublicStaging', packageName);

    await uploadApp(clientManager, appPath, destPackagePath);

    const installer = await clientManager.getInstallationProxyClient();
    await installer.installApp(
      destPackagePath,
      bundleId,
      {
        // https://github.com/ios-control/ios-deploy/blob/0f2ffb1e564aa67a2dfca7cdf13de47ce489d835/src/ios-deploy/ios-deploy.m#L2491-L2508
        ApplicationsType: 'Any',

        CFBundleIdentifier: bundleId,
        CloseOnInvalidate: '1',
        InvalidateOnDetach: '1',
        IsUserInitiated: '1',
        // Disable checking for wifi devices, this is nominally faster.
        PreferWifi: '0',
        // Only info I could find on these:
        // https://github.com/wwxxyx/Quectel_BG96/blob/310876f90fc1093a59e45e381160eddcc31697d0/Apple_Homekit/homekit_certification_tools/ATS%206/ATS%206/ATS.app/Contents/Frameworks/CaptureKit.framework/Versions/A/Resources/MobileDevice/MobileInstallation.h#L112-L121
        PackageType: 'Developer',
        ShadowParentKey: deltaPath,
        // SkipUninstall: '1'
      },
      onProgress
    );

    const { [bundleId]: appInfo } = await installer.lookupApp([bundleId]);
    // launch fails with EBusy or ENotFound if you try to launch immediately after install
    await wait(200);
    const debugServerClient = await launchApp(clientManager, { appInfo, detach: !waitForApp });
    if (waitForApp) {
      onBeforeExit(async () => {
        // causes continue() to return
        debugServerClient.halt();
        // give continue() time to return response
        await wait(64);
      });

      debug(`Waiting for app to close...\n`);
      const result = await debugServerClient.continue();
      // TODO: I have no idea what this packet means yet (successful close?)
      // if not a close (ie, most likely due to halt from onBeforeExit), then kill the app
      if (result !== 'W00') {
        await debugServerClient.kill();
      }
    }
  } finally {
    clientManager.end();
  }
}

async function mountDeveloperDiskImage(clientManager: ClientManager) {
  const imageMounter = await clientManager.getMobileImageMounterClient();
  // Check if already mounted. If not, mount.
  if (!(await imageMounter.lookupImage()).ImageSignature) {
    // verify DeveloperDiskImage exists (TODO: how does this work on Windows/Linux?)
    // TODO: if windows/linux, download?
    const version = await (await clientManager.getLockdowndClient()).getValue('ProductVersion');
    const developerDiskImagePath = await getDeveloperDiskImagePath(version);
    const developerDiskImageSig = readFileSync(`${developerDiskImagePath}.signature`);
    await imageMounter.uploadImage(developerDiskImagePath, developerDiskImageSig);
    await imageMounter.mountImage(developerDiskImagePath, developerDiskImageSig);
  }
}

async function uploadApp(clientManager: ClientManager, srcPath: string, destinationPath: string) {
  const afcClient = await clientManager.getAFCClient();
  try {
    await afcClient.getFileInfo('PublicStaging');
  } catch (err: any) {
    if (err instanceof AFCError && err.status === AFC_STATUS.OBJECT_NOT_FOUND) {
      await afcClient.makeDirectory('PublicStaging');
    } else {
      throw err;
    }
  }
  await afcClient.uploadDirectory(srcPath, destinationPath);
}

async function launchApp(
  clientManager: ClientManager,
  { appInfo, detach }: { appInfo: IPLookupResult[string]; detach?: boolean }
) {
  let tries = 0;
  while (tries < 3) {
    const debugServerClient = await clientManager.getDebugserverClient();
    await debugServerClient.setMaxPacketSize(1024);
    await debugServerClient.setWorkingDir(appInfo.Container);
    await debugServerClient.launchApp(appInfo.Path, appInfo.CFBundleExecutable);

    const result = await debugServerClient.checkLaunchSuccess();
    if (result === 'OK') {
      if (detach) {
        // https://github.com/libimobiledevice/libimobiledevice/blob/25059d4c7d75e03aab516af2929d7c6e6d4c17de/tools/idevicedebug.c#L455-L464
        const res = await debugServerClient.sendCommand('D', []);
        debug('Disconnect from debug server request:', res);
        if (res !== 'OK') {
          console.warn(
            'Something went wrong while attempting to disconnect from iOS debug server, you may need to reopen the app manually.'
          );
        }
      }

      return debugServerClient;
    } else if (result === 'EBusy' || result === 'ENotFound') {
      debug('Device busy or app not found, trying to launch again in .5s...');
      tries++;
      debugServerClient.socket.end();
      await wait(500);
    } else {
      throw new Error(`There was an error launching app: ${result}`);
    }
  }
  throw new Error('Unable to launch app, number of tries exceeded');
}
