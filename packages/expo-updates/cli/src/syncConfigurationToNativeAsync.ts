import { getConfig } from '@expo/config';
import { XML, AndroidConfig, IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs-extra';
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
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });

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
    androidManifest
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
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });

  const expoPlist = await readExpoPlistAsync(options.projectRoot);
  const updatedExpoPlist = await IOSConfig.Updates.setUpdatesConfigAsync(
    options.projectRoot,
    exp,
    expoPlist
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
  if (await fs.pathExists(plistPath)) {
    const expoPlistContent = await fs.readFile(plistPath, 'utf8');
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
  await fs.mkdirp(path.dirname(plistPath));
  await fs.writeFile(plistPath, contents);
}
