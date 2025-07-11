import assert from 'assert';
import fs from 'fs';
import path from 'path';

import * as XML from '../utils/XML';

export type StringBoolean = 'true' | 'false';

type ManifestMetaDataAttributes = AndroidManifestAttributes & {
  'android:value'?: string;
  'android:resource'?: string;
};

type AndroidManifestAttributes = {
  'android:name': string | 'android.intent.action.VIEW';
  'tools:node'?: string | 'remove';
};

type ManifestAction = {
  $: AndroidManifestAttributes;
};

type ManifestCategory = {
  $: AndroidManifestAttributes;
};

type ManifestData = {
  $: {
    [key: string]: string | undefined;
    'android:host'?: string;
    'android:pathPrefix'?: string;
    'android:scheme'?: string;
  };
};

type ManifestReceiver = {
  $: AndroidManifestAttributes & {
    'android:exported'?: StringBoolean;
    'android:enabled'?: StringBoolean;
  };
  'intent-filter'?: ManifestIntentFilter[];
};

export type ManifestIntentFilter = {
  $?: {
    'android:autoVerify'?: StringBoolean;
    'data-generated'?: StringBoolean;
  };
  action?: ManifestAction[];
  data?: ManifestData[];
  category?: ManifestCategory[];
};

export type ManifestMetaData = {
  $: ManifestMetaDataAttributes;
};

type ManifestServiceAttributes = AndroidManifestAttributes & {
  'android:enabled'?: StringBoolean;
  'android:exported'?: StringBoolean;
  'android:permission'?: string;
  'android:foregroundServiceType'?: string;
  // ...
};

type ManifestService = {
  $: ManifestServiceAttributes;
  'intent-filter'?: ManifestIntentFilter[];
};

type ManifestApplicationAttributes = {
  'android:name': string | '.MainApplication';
  'android:icon'?: string;
  'android:roundIcon'?: string;
  'android:label'?: string;
  'android:allowBackup'?: StringBoolean;
  'android:largeHeap'?: StringBoolean;
  'android:requestLegacyExternalStorage'?: StringBoolean;
  'android:supportsPictureInPicture'?: StringBoolean;
  'android:usesCleartextTraffic'?: StringBoolean;
  [key: string]: string | undefined;
};

export type ManifestActivity = {
  $: ManifestApplicationAttributes & {
    'android:exported'?: StringBoolean;
    'android:launchMode'?: string;
    'android:theme'?: string;
    'android:windowSoftInputMode'?:
      | string
      | 'stateUnspecified'
      | 'stateUnchanged'
      | 'stateHidden'
      | 'stateAlwaysHidden'
      | 'stateVisible'
      | 'stateAlwaysVisible'
      | 'adjustUnspecified'
      | 'adjustResize'
      | 'adjustPan';
    [key: string]: string | undefined;
  };
  'intent-filter'?: ManifestIntentFilter[];
  // ...
};

export type ManifestActivityAlias = {
  $: ManifestActivity['$'] & {
    'android:targetActivity'?: string;
  };
  'intent-filter'?: ManifestIntentFilter[];
};

export type ManifestUsesLibrary = {
  $: AndroidManifestAttributes & {
    'android:required'?: StringBoolean;
  };
};

export type ManifestApplication = {
  $: ManifestApplicationAttributes;
  activity?: ManifestActivity[];
  'activity-alias'?: ManifestActivityAlias[];
  service?: ManifestService[];
  receiver?: ManifestReceiver[];
  'meta-data'?: ManifestMetaData[];
  'uses-library'?: ManifestUsesLibrary[];
  // ...
};

type ManifestPermission = {
  $: AndroidManifestAttributes & {
    'android:protectionLevel'?: string | 'signature';
  };
};

export type ManifestUsesPermission = {
  $: AndroidManifestAttributes;
};

type ManifestUsesFeature = {
  $: AndroidManifestAttributes & {
    'android:glEsVersion'?: string;
    'android:required': StringBoolean;
  };
};

export type AndroidManifest = {
  manifest: {
    // Probably more, but this is currently all we'd need for most cases in Expo.
    $: {
      'xmlns:android': string;
      'xmlns:tools'?: string;
      package?: string;
      [key: string]: string | undefined;
    };
    permission?: ManifestPermission[];
    'uses-permission'?: ManifestUsesPermission[];
    'uses-permission-sdk-23'?: ManifestUsesPermission[];
    'uses-feature'?: ManifestUsesFeature[];
    queries: ManifestQuery[];
    application?: ManifestApplication[];
  };
};

type ManifestQueryIntent = Omit<ManifestIntentFilter, '$'>;

export type ManifestQuery = {
  package?: {
    $: {
      'android:name': string;
    };
  }[];
  intent?: ManifestQueryIntent[];
  provider?: {
    $: {
      'android:authorities': string;
    };
  }[];
};

export async function writeAndroidManifestAsync(
  manifestPath: string,
  androidManifest: AndroidManifest
): Promise<void> {
  const manifestXml = XML.format(androidManifest);
  await fs.promises.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.promises.writeFile(manifestPath, manifestXml);
}

export async function readAndroidManifestAsync(manifestPath: string): Promise<AndroidManifest> {
  const xml = await XML.readXMLAsync({ path: manifestPath });
  if (!isManifest(xml)) {
    throw new Error('Invalid manifest found at: ' + manifestPath);
  }
  return xml;
}

function isManifest(xml: XML.XMLObject): xml is AndroidManifest {
  // TODO: Maybe more validation
  return !!xml.manifest;
}

/** Returns the `manifest.application` tag ending in `.MainApplication` */
export function getMainApplication(androidManifest: AndroidManifest): ManifestApplication | null {
  return (
    androidManifest?.manifest?.application?.filter((e) =>
      e?.$?.['android:name'].endsWith('.MainApplication')
    )[0] ?? null
  );
}

export function getMainApplicationOrThrow(androidManifest: AndroidManifest): ManifestApplication {
  const mainApplication = getMainApplication(androidManifest);
  assert(mainApplication, 'AndroidManifest.xml is missing the required MainApplication element');
  return mainApplication;
}

export function getMainActivityOrThrow(androidManifest: AndroidManifest): ManifestActivity {
  const mainActivity = getMainActivity(androidManifest);
  assert(mainActivity, 'AndroidManifest.xml is missing the required MainActivity element');
  return mainActivity;
}

function hasMainActionIntentFilter(intentFilter: ManifestIntentFilter): boolean {
  return !!intentFilter.action?.find(
    (action) => action.$['android:name'] === 'android.intent.action.MAIN'
  );
}

function hasLauncherCategoryIntentFilter(intentFilter: ManifestIntentFilter): boolean {
  return !!intentFilter.category?.find(
    (category) => category.$['android:name'] === 'android.intent.category.LAUNCHER'
  );
}

export function getRunnableActivity(androidManifest: AndroidManifest): ManifestActivity | null {
  // Get enabled activities
  const enabledActivities = androidManifest?.manifest?.application?.[0]?.activity?.filter?.(
    (e: any) => e.$['android:enabled'] !== 'false' && e.$['android:enabled'] !== false
  );

  if (!enabledActivities) {
    return null;
  }

  const { mainActionActivites, runnableActivities } = enabledActivities.reduce(
    (prev, activity) => {
      if (Array.isArray(activity['intent-filter'])) {
        for (const intentFilter of activity['intent-filter']) {
          const isMainActionIntentFilter = hasMainActionIntentFilter(intentFilter);
          const isLauncherCategoryIntentFilter = hasLauncherCategoryIntentFilter(intentFilter);

          if (isMainActionIntentFilter && isLauncherCategoryIntentFilter) {
            prev.runnableActivities.push(activity);
          }
          if (isMainActionIntentFilter) {
            prev.mainActionActivites.push(activity);
          }
        }
      }
      return prev;
    },
    { mainActionActivites: [] as ManifestActivity[], runnableActivities: [] as ManifestActivity[] }
  );

  if (runnableActivities.length) {
    return runnableActivities[0];
  }

  // No runnable activity found, look for enabled activity aliases
  const enabledActivityAliases = androidManifest?.manifest?.application?.[0]?.[
    'activity-alias'
  ]?.filter?.((e: any) => e.$['android:enabled'] !== 'false' && e.$['android:enabled'] !== false);

  if (!enabledActivityAliases) {
    return null;
  }

  // Look for the activity alias that has a runnable intent-filter
  // and a targetActivity pointing to an existing main action activity
  for (const activityAlias of enabledActivityAliases) {
    if (Array.isArray(activityAlias['intent-filter'])) {
      for (const intentFilter of activityAlias['intent-filter']) {
        const isMainActionIntentFilter = hasMainActionIntentFilter(intentFilter);
        const isLauncherCategoryIntentFilter = hasLauncherCategoryIntentFilter(intentFilter);
        if (isMainActionIntentFilter && isLauncherCategoryIntentFilter) {
          const targetActivity = activityAlias.$['android:targetActivity'];
          if (targetActivity) {
            const target = mainActionActivites.find((e) => e.$['android:name'] === targetActivity);
            if (target) {
              return target;
            }
          }
        }
      }
    }
  }

  return null;
}

export function getMainActivity(androidManifest: AndroidManifest): ManifestActivity | null {
  const mainActivity = androidManifest?.manifest?.application?.[0]?.activity?.filter?.(
    (e: any) => e.$['android:name'] === '.MainActivity'
  );
  return mainActivity?.[0] ?? null;
}

export function addMetaDataItemToMainApplication(
  mainApplication: ManifestApplication,
  itemName: string,
  itemValue: string,
  itemType: 'resource' | 'value' = 'value'
): ManifestApplication {
  let existingMetaDataItem;
  const newItem = {
    $: prefixAndroidKeys({ name: itemName, [itemType]: itemValue }),
  } as ManifestMetaData;
  if (mainApplication['meta-data']) {
    existingMetaDataItem = mainApplication['meta-data'].filter(
      (e: any) => e.$['android:name'] === itemName
    );
    if (existingMetaDataItem.length) {
      existingMetaDataItem[0].$[`android:${itemType}` as keyof ManifestMetaDataAttributes] =
        itemValue;
    } else {
      mainApplication['meta-data'].push(newItem);
    }
  } else {
    mainApplication['meta-data'] = [newItem];
  }
  return mainApplication;
}

export function removeMetaDataItemFromMainApplication(mainApplication: any, itemName: string) {
  const index = findMetaDataItem(mainApplication, itemName);
  if (mainApplication?.['meta-data'] && index > -1) {
    mainApplication['meta-data'].splice(index, 1);
  }
  return mainApplication;
}

function findApplicationSubItem(
  mainApplication: ManifestApplication,
  category: keyof ManifestApplication,
  itemName: string
): number {
  const parent = mainApplication[category];
  if (Array.isArray(parent)) {
    const index = parent.findIndex((e: any) => e.$['android:name'] === itemName);

    return index;
  }
  return -1;
}

export function findMetaDataItem(mainApplication: any, itemName: string): number {
  return findApplicationSubItem(mainApplication, 'meta-data', itemName);
}

export function findUsesLibraryItem(mainApplication: any, itemName: string): number {
  return findApplicationSubItem(mainApplication, 'uses-library', itemName);
}

export function getMainApplicationMetaDataValue(
  androidManifest: AndroidManifest,
  name: string
): string | null {
  const mainApplication = getMainApplication(androidManifest);

  if (mainApplication?.hasOwnProperty('meta-data')) {
    const item = mainApplication?.['meta-data']?.find((e: any) => e.$['android:name'] === name);
    return item?.$['android:value'] ?? null;
  }

  return null;
}

export function addUsesLibraryItemToMainApplication(
  mainApplication: ManifestApplication,
  item: { name: string; required?: boolean }
): ManifestApplication {
  let existingMetaDataItem;
  const newItem = {
    $: prefixAndroidKeys(item),
  } as ManifestUsesLibrary;

  if (mainApplication['uses-library']) {
    existingMetaDataItem = mainApplication['uses-library'].filter(
      (e) => e.$['android:name'] === item.name
    );
    if (existingMetaDataItem.length) {
      existingMetaDataItem[0].$ = newItem.$;
    } else {
      mainApplication['uses-library'].push(newItem);
    }
  } else {
    mainApplication['uses-library'] = [newItem];
  }
  return mainApplication;
}

export function removeUsesLibraryItemFromMainApplication(
  mainApplication: ManifestApplication,
  itemName: string
) {
  const index = findUsesLibraryItem(mainApplication, itemName);
  if (mainApplication?.['uses-library'] && index > -1) {
    mainApplication['uses-library'].splice(index, 1);
  }
  return mainApplication;
}

export function prefixAndroidKeys<T extends Record<string, any> = Record<string, string>>(
  head: T
): Record<string, any> {
  // prefix all keys with `android:`
  return Object.entries(head).reduce(
    (prev, [key, curr]) => ({ ...prev, [`android:${key}`]: curr }),
    {} as T
  );
}

/**
 * Ensure the `tools:*` namespace is available in the manifest.
 *
 * @param manifest AndroidManifest.xml
 * @returns manifest with the `tools:*` namespace available
 */
export function ensureToolsAvailable(manifest: AndroidManifest) {
  return ensureManifestHasNamespace(manifest, {
    namespace: 'xmlns:tools',
    url: 'http://schemas.android.com/tools',
  });
}

/**
 * Ensure a particular namespace is available in the manifest.
 *
 * @param manifest `AndroidManifest.xml`
 * @returns manifest with the provided namespace available
 */
function ensureManifestHasNamespace(
  manifest: AndroidManifest,
  { namespace, url }: { namespace: string; url: string }
) {
  if (manifest?.manifest?.$?.[namespace]) {
    return manifest;
  }
  manifest.manifest.$[namespace] = url;
  return manifest;
}
