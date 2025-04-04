import { getConfig } from '@expo/config';
import { XML, AndroidConfig, IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs';
import path from 'path';

import { Workflow } from '../../utils/build/workflow';

type SyncConfigurationToNativeOptions = {
  projectRoot: string;
  platform: 'ios' | 'android';
  workflow: Workflow;
};

/**
 * Synchronize updates configuration to native files. This needs to do essentially the same thing as `withUpdates`
 */
export async function syncConfigurationToNativeAsync(
  options: SyncConfigurationToNativeOptions
): Promise<void> {
  if (options.workflow !== 'generic') {
    // not applicable to managed workflow
    return;
  }

  switch (options.platform) {
    case 'android':
      await syncConfigurationToNativeAndroidAsync(options);
      break;
    case 'ios':
      await syncConfigurationToNativeIosAsync(options);
      break;
  }
}

async function syncConfigurationToNativeAndroidAsync(
  options: SyncConfigurationToNativeOptions
): Promise<void> {
  const { exp } = getConfig(options.projectRoot, {
    isPublicConfig: false, // This must be false or it will drop codesigning config
    skipSDKVersionRequirement: true,
  });

  const packageVersion = require('../../package.json').version;

  // sync AndroidManifest.xml
  const androidManifestPath = await AndroidConfig.Paths.getAndroidManifestAsync(
    options.projectRoot
  );
  if (!androidManifestPath) {
    throw new Error(
      `Could not find AndroidManifest.xml in project directory: "${options.projectRoot}"`
    );
  }
  const androidManifest =
    await AndroidConfig.Manifest.readAndroidManifestAsync(androidManifestPath);

  const updatedAndroidManifest = await AndroidConfig.Updates.setUpdatesConfigAsync(
    options.projectRoot,
    exp,
    androidManifest,
    packageVersion
  );
  await AndroidConfig.Manifest.writeAndroidManifestAsync(
    androidManifestPath,
    updatedAndroidManifest
  );

  // sync strings.xml
  const stringsJSONPath = await AndroidConfig.Strings.getProjectStringsXMLPathAsync(
    options.projectRoot
  );
  const stringsResourceXML = await AndroidConfig.Resources.readResourcesXMLAsync({
    path: stringsJSONPath,
  });

  const updatedStringsResourceXML =
    await AndroidConfig.Updates.applyRuntimeVersionFromConfigForProjectRootAsync(
      options.projectRoot,
      exp,
      stringsResourceXML
    );
  await XML.writeXMLAsync({ path: stringsJSONPath, xml: updatedStringsResourceXML });
}

async function syncConfigurationToNativeIosAsync(
  options: SyncConfigurationToNativeOptions
): Promise<void> {
  const { exp } = getConfig(options.projectRoot, {
    isPublicConfig: false, // This must be false or it will drop codesigning config
    skipSDKVersionRequirement: true,
  });

  const packageVersion = require('../../package.json').version;

  const expoPlist = await readExpoPlistAsync(options.projectRoot);
  const updatedExpoPlist = await IOSConfig.Updates.setUpdatesConfigAsync(
    options.projectRoot,
    exp,
    expoPlist,
    packageVersion
  );
  await writeExpoPlistAsync(options.projectRoot, updatedExpoPlist);
}

async function readExpoPlistAsync(projectDir: string): Promise<IOSConfig.ExpoPlist> {
  const expoPlistPath = IOSConfig.Paths.getExpoPlistPath(projectDir);
  return ((await readPlistAsync(expoPlistPath)) ?? {}) as IOSConfig.ExpoPlist;
}

async function writeExpoPlistAsync(
  projectDir: string,
  expoPlist: IOSConfig.ExpoPlist
): Promise<void> {
  const expoPlistPath = IOSConfig.Paths.getExpoPlistPath(projectDir);
  await writePlistAsync(expoPlistPath, expoPlist);
}

async function readPlistAsync(plistPath: string): Promise<object | null> {
  if (fs.existsSync(plistPath)) {
    const expoPlistContent = await fs.promises.readFile(plistPath, 'utf8');
    try {
      return plist.parse(expoPlistContent);
    } catch (err: any) {
      err.message = `Failed to parse ${plistPath}. ${err.message}`;
      throw err;
    }
  } else {
    return null;
  }
}

async function writePlistAsync(
  plistPath: string,
  plistObject: IOSConfig.ExpoPlist | IOSConfig.InfoPlist
): Promise<void> {
  const contents = plist.build(plistObject);
  await fs.promises.mkdir(path.dirname(plistPath), { recursive: true });
  await fs.promises.writeFile(plistPath, contents, 'utf8');
}
