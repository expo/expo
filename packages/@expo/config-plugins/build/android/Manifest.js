"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addMetaDataItemToMainApplication = addMetaDataItemToMainApplication;
exports.addUsesLibraryItemToMainApplication = addUsesLibraryItemToMainApplication;
exports.ensureToolsAvailable = ensureToolsAvailable;
exports.findMetaDataItem = findMetaDataItem;
exports.findUsesLibraryItem = findUsesLibraryItem;
exports.getMainActivity = getMainActivity;
exports.getMainActivityOrThrow = getMainActivityOrThrow;
exports.getMainApplication = getMainApplication;
exports.getMainApplicationMetaDataValue = getMainApplicationMetaDataValue;
exports.getMainApplicationOrThrow = getMainApplicationOrThrow;
exports.getRunnableActivity = getRunnableActivity;
exports.prefixAndroidKeys = prefixAndroidKeys;
exports.readAndroidManifestAsync = readAndroidManifestAsync;
exports.removeMetaDataItemFromMainApplication = removeMetaDataItemFromMainApplication;
exports.removeUsesLibraryItemFromMainApplication = removeUsesLibraryItemFromMainApplication;
exports.writeAndroidManifestAsync = writeAndroidManifestAsync;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function XML() {
  const data = _interopRequireWildcard(require("../utils/XML"));
  XML = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// https://developer.android.com/guide/topics/manifest/activity-alias-element

async function writeAndroidManifestAsync(manifestPath, androidManifest) {
  const manifestXml = XML().format(androidManifest);
  await _fs().default.promises.mkdir(_path().default.dirname(manifestPath), {
    recursive: true
  });
  await _fs().default.promises.writeFile(manifestPath, manifestXml);
}
async function readAndroidManifestAsync(manifestPath) {
  const xml = await XML().readXMLAsync({
    path: manifestPath
  });
  if (!isManifest(xml)) {
    throw new Error('Invalid manifest found at: ' + manifestPath);
  }
  return xml;
}
function isManifest(xml) {
  // TODO: Maybe more validation
  return !!xml.manifest;
}

/** Returns the `manifest.application` tag ending in `.MainApplication` */
function getMainApplication(androidManifest) {
  return androidManifest?.manifest?.application?.filter(e => e?.$?.['android:name'].endsWith('.MainApplication'))[0] ?? null;
}
function getMainApplicationOrThrow(androidManifest) {
  const mainApplication = getMainApplication(androidManifest);
  (0, _assert().default)(mainApplication, 'AndroidManifest.xml is missing the required MainApplication element');
  return mainApplication;
}
function getMainActivityOrThrow(androidManifest) {
  const mainActivity = getMainActivity(androidManifest);
  (0, _assert().default)(mainActivity, 'AndroidManifest.xml is missing the required MainActivity element');
  return mainActivity;
}
function getRunnableActivity(androidManifest) {
  const firstApplication = androidManifest?.manifest?.application?.[0] ?? getMainApplication(androidManifest);
  if (!firstApplication) {
    return null;
  }

  // Get enabled activities
  const enabledActivities = firstApplication.activity?.filter?.(e => e.$['android:enabled'] !== 'false' && e.$['android:enabled'] !== false);
  if (!enabledActivities) {
    return null;
  }
  const isIntentFilterRunnable = intentFilter => {
    return !!intentFilter.action?.some(action => action.$['android:name'] === 'android.intent.action.MAIN') && !!intentFilter.category?.some(category => category.$['android:name'] === 'android.intent.category.LAUNCHER');
  };

  // Get the activity that has a runnable intent-filter
  for (const activity of enabledActivities) {
    if (Array.isArray(activity['intent-filter'])) {
      for (const intentFilter of activity['intent-filter']) {
        if (isIntentFilterRunnable(intentFilter)) {
          return activity;
        }
      }
    }
  }
  const enabledActivityNames = enabledActivities.map(e => e.$['android:name']);
  // If no runnable activity is found, check for matching activity-alias that may be runnable
  const aliases = (firstApplication['activity-alias'] ?? []).filter(
  // https://developer.android.com/guide/topics/manifest/activity-alias-element
  e => e.$['android:enabled'] !== 'false' && enabledActivityNames.includes(e.$['android:targetActivity']));
  if (aliases.length) {
    for (const alias of aliases) {
      if (Array.isArray(alias['intent-filter'])) {
        for (const intentFilter of alias['intent-filter']) {
          if (isIntentFilterRunnable(intentFilter)) {
            const matchingActivity = enabledActivities.find(e => e.$['android:name'] === alias.$['android:targetActivity']);
            if (matchingActivity) {
              return matchingActivity;
            }
          }
        }
      }
    }
  }
  return null;
}
function getMainActivity(androidManifest) {
  const mainActivity = androidManifest?.manifest?.application?.[0]?.activity?.filter?.(e => e.$['android:name'] === '.MainActivity');
  return mainActivity?.[0] ?? null;
}
function addMetaDataItemToMainApplication(mainApplication, itemName, itemValue, itemType = 'value') {
  let existingMetaDataItem;
  const newItem = {
    $: prefixAndroidKeys({
      name: itemName,
      [itemType]: itemValue
    })
  };
  if (mainApplication['meta-data']) {
    existingMetaDataItem = mainApplication['meta-data'].filter(e => e.$['android:name'] === itemName);
    if (existingMetaDataItem.length) {
      existingMetaDataItem[0].$[`android:${itemType}`] = itemValue;
    } else {
      mainApplication['meta-data'].push(newItem);
    }
  } else {
    mainApplication['meta-data'] = [newItem];
  }
  return mainApplication;
}
function removeMetaDataItemFromMainApplication(mainApplication, itemName) {
  const index = findMetaDataItem(mainApplication, itemName);
  if (mainApplication?.['meta-data'] && index > -1) {
    mainApplication['meta-data'].splice(index, 1);
  }
  return mainApplication;
}
function findApplicationSubItem(mainApplication, category, itemName) {
  const parent = mainApplication[category];
  if (Array.isArray(parent)) {
    const index = parent.findIndex(e => e.$['android:name'] === itemName);
    return index;
  }
  return -1;
}
function findMetaDataItem(mainApplication, itemName) {
  return findApplicationSubItem(mainApplication, 'meta-data', itemName);
}
function findUsesLibraryItem(mainApplication, itemName) {
  return findApplicationSubItem(mainApplication, 'uses-library', itemName);
}
function getMainApplicationMetaDataValue(androidManifest, name) {
  const mainApplication = getMainApplication(androidManifest);
  if (mainApplication?.hasOwnProperty('meta-data')) {
    const item = mainApplication?.['meta-data']?.find(e => e.$['android:name'] === name);
    return item?.$['android:value'] ?? null;
  }
  return null;
}
function addUsesLibraryItemToMainApplication(mainApplication, item) {
  let existingMetaDataItem;
  const newItem = {
    $: prefixAndroidKeys(item)
  };
  if (mainApplication['uses-library']) {
    existingMetaDataItem = mainApplication['uses-library'].filter(e => e.$['android:name'] === item.name);
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
function removeUsesLibraryItemFromMainApplication(mainApplication, itemName) {
  const index = findUsesLibraryItem(mainApplication, itemName);
  if (mainApplication?.['uses-library'] && index > -1) {
    mainApplication['uses-library'].splice(index, 1);
  }
  return mainApplication;
}
function prefixAndroidKeys(head) {
  // prefix all keys with `android:`
  return Object.entries(head).reduce((prev, [key, curr]) => ({
    ...prev,
    [`android:${key}`]: curr
  }), {});
}

/**
 * Ensure the `tools:*` namespace is available in the manifest.
 *
 * @param manifest AndroidManifest.xml
 * @returns manifest with the `tools:*` namespace available
 */
function ensureToolsAvailable(manifest) {
  return ensureManifestHasNamespace(manifest, {
    namespace: 'xmlns:tools',
    url: 'http://schemas.android.com/tools'
  });
}

/**
 * Ensure a particular namespace is available in the manifest.
 *
 * @param manifest `AndroidManifest.xml`
 * @returns manifest with the provided namespace available
 */
function ensureManifestHasNamespace(manifest, {
  namespace,
  url
}) {
  if (manifest?.manifest?.$?.[namespace]) {
    return manifest;
  }
  manifest.manifest.$[namespace] = url;
  return manifest;
}
//# sourceMappingURL=Manifest.js.map