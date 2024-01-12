import Debug from 'debug';
import fs from 'fs';
import path from 'path';

import { ClientManager } from './ClientManager';
import { IPLookupResult, OnInstallProgressCallback } from './client/InstallationProxyClient';
import { LockdowndClient } from './client/LockdowndClient';
import { UsbmuxdClient } from './client/UsbmuxdClient';
import { AFC_STATUS, AFCError } from './protocol/AFCProtocol';
import { Log } from '../../../log';
import { XcodeDeveloperDiskImagePrerequisite } from '../../../start/doctor/apple/XcodeDeveloperDiskImagePrerequisite';
import { xcrunAsync } from '../../../start/platforms/ios/xcrun';
import { delayAsync } from '../../../utils/delay';
import { CommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';

const debug = Debug('expo:apple-device');

// NOTE(EvanBacon): I have a feeling this shape will change with new iOS versions (tested against iOS 15).
export interface ConnectedDevice {
  /** @example `00008101-001964A22629003A` */
  udid: string;
  /** @example `Evan's phone` */
  name: string;
  /** @example `iPhone13,4` */
  model: string;
  /** @example `device` */
  deviceType: 'device' | 'catalyst';
  /** @example `USB` */
  connectionType: 'USB' | 'Network';
  /** @example `15.4.1` */
  osVersion: string;
}

/** @returns a list of connected Apple devices. */
export async function getConnectedDevicesAsync(): Promise<ConnectedDevice[]> {
  const client = new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket());
  const devices = await client.getDevices();
  client.socket.end();

  return Promise.all(
    devices.map(async (device): Promise<ConnectedDevice> => {
      const socket = await new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket()).connect(
        device,
        62078
      );
      const deviceValues = await new LockdowndClient(socket).getAllValues();
      socket.end();
      // TODO(EvanBacon): Add support for osType (ipad, watchos, etc)
      return {
        // TODO(EvanBacon): Better name
        name: deviceValues.DeviceName ?? deviceValues.ProductType ?? 'unknown iOS device',
        model: deviceValues.ProductType,
        osVersion: deviceValues.ProductVersion,
        deviceType: 'device',
        connectionType: device.Properties.ConnectionType,
        udid: device.Properties.SerialNumber,
      };
    })
  );
}

/** Install and run an Apple app binary on a connected Apple device. */
export async function runOnDevice({
  udid,
  appPath,
  bundleId,
  waitForApp,
  deltaPath,
  onProgress,
}: {
  /** Apple device UDID */
  udid: string;
  /** File path to the app binary (ipa) */
  appPath: string;
  /** Bundle identifier for the app at `appPath` */
  bundleId: string;
  /** Wait for the app to launch before returning */
  waitForApp: boolean;
  /** File path to the app deltas folder to use for faster subsequent installs */
  deltaPath: string;
  /** Callback to be called with progress updates */
  onProgress: OnInstallProgressCallback;
}) {
  const clientManager = await ClientManager.create(udid);

  try {
    await mountDeveloperDiskImage(clientManager);

    const packageName = path.basename(appPath);
    const destPackagePath = path.join('PublicStaging', packageName);

    await uploadApp(clientManager, { appBinaryPath: appPath, destinationPath: destPackagePath });

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

    const {
      // TODO(EvanBacon): This can be undefined when querying App Clips.
      [bundleId]: appInfo,
    } = await installer.lookupApp([bundleId]);

    if (appInfo) {
      // launch fails with EBusy or ENotFound if you try to launch immediately after install
      await delayAsync(200);
      const debugServerClient = await launchApp(clientManager, {
        bundleId,
        appInfo,
        detach: !waitForApp,
      });

      if (waitForApp && debugServerClient) {
        installExitHooks(async () => {
          // causes continue() to return
          debugServerClient.halt();
          // give continue() time to return response
          await delayAsync(64);
        });

        debug(`Waiting for app to close...\n`);
        const result = await debugServerClient.continue();
        // TODO: I have no idea what this packet means yet (successful close?)
        // if not a close (ie, most likely due to halt from onBeforeExit), then kill the app
        if (result !== 'W00') {
          await debugServerClient.kill();
        }
      }
    } else {
      Log.warn(`App "${bundleId}" installed but couldn't be launched. Open on device manually.`);
    }
  } finally {
    clientManager.end();
  }
}

/** Mount the developer disk image for Xcode. */
async function mountDeveloperDiskImage(clientManager: ClientManager) {
  const imageMounter = await clientManager.getMobileImageMounterClient();
  // Check if already mounted. If not, mount.
  if (!(await imageMounter.lookupImage()).ImageSignature) {
    // verify DeveloperDiskImage exists (TODO: how does this work on Windows/Linux?)
    // TODO: if windows/linux, download?
    const version = await (await clientManager.getLockdowndClient()).getValue('ProductVersion');
    const developerDiskImagePath = await XcodeDeveloperDiskImagePrerequisite.instance.assertAsync({
      version,
    });
    const developerDiskImageSig = fs.readFileSync(`${developerDiskImagePath}.signature`);
    await imageMounter.uploadImage(developerDiskImagePath, developerDiskImageSig);
    await imageMounter.mountImage(developerDiskImagePath, developerDiskImageSig);
  }
}

async function uploadApp(
  clientManager: ClientManager,
  { appBinaryPath, destinationPath }: { appBinaryPath: string; destinationPath: string }
) {
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
  await afcClient.uploadDirectory(appBinaryPath, destinationPath);
}

async function launchAppWithUsbmux(
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
      await delayAsync(500);
    } else {
      throw new CommandError(`There was an error launching app: ${result}`);
    }
  }
  throw new CommandError('Unable to launch app, number of tries exceeded');
}

/** @internal Exposed for testing */
export async function launchAppWithDeviceCtl(deviceId: string, bundleId: string) {
  try {
    await xcrunAsync(['devicectl', 'device', 'process', 'launch', '--device', deviceId, bundleId]);
  } catch (error: any) {
    if ('stderr' in error) {
      const errorCodes = getDeviceCtlErrorCodes(error.stderr);
      if (errorCodes.includes('Locked')) {
        throw new CommandError('APPLE_DEVICE_LOCKED', 'Device is locked, unlock and try again.');
      }
    }

    throw new CommandError(`There was an error launching app: ${error}`);
  }
}

/** Find all error codes from the output log */
function getDeviceCtlErrorCodes(log: string): string[] {
  return [...log.matchAll(/BSErrorCodeDescription\s+=\s+(.*)$/gim)].map(([_line, code]) => code);
}

/**
 * iOS 17 introduces a new protocol called RemoteXPC.
 * This is not yet implemented, so we fallback to devicectl.
 *
 * @see https://github.com/doronz88/pymobiledevice3/blob/master/misc/RemoteXPC.md#process-remoted
 */
async function launchApp(
  clientManager: ClientManager,
  {
    bundleId,
    appInfo,
    detach,
  }: { bundleId: string; appInfo: IPLookupResult[string]; detach?: boolean }
) {
  try {
    return await launchAppWithUsbmux(clientManager, { appInfo, detach });
  } catch (error) {
    debug('Failed to launch app with Usbmuxd, falling back to xcrun...', error);

    // Get the device UDID and close the connection, to allow `xcrun devicectl` to connect
    const deviceId = clientManager.device.Properties.SerialNumber;
    clientManager.end();

    // Fallback to devicectl for iOS 17 support
    return await launchAppWithDeviceCtl(deviceId, bundleId);
  }
}
