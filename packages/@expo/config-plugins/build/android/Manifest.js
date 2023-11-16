"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureToolsAvailable = exports.prefixAndroidKeys = exports.removeUsesLibraryItemFromMainApplication = exports.addUsesLibraryItemToMainApplication = exports.getMainApplicationMetaDataValue = exports.findUsesLibraryItem = exports.findMetaDataItem = exports.removeMetaDataItemFromMainApplication = exports.addMetaDataItemToMainApplication = exports.getMainActivity = exports.getRunnableActivity = exports.getMainActivityOrThrow = exports.getMainApplicationOrThrow = exports.getMainApplication = exports.readAndroidManifestAsync = exports.writeAndroidManifestAsync = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const XML = __importStar(require("../utils/XML"));
async function writeAndroidManifestAsync(manifestPath, androidManifest) {
    const manifestXml = XML.format(androidManifest);
    await fs_1.default.promises.mkdir(path_1.default.dirname(manifestPath), { recursive: true });
    await fs_1.default.promises.writeFile(manifestPath, manifestXml);
}
exports.writeAndroidManifestAsync = writeAndroidManifestAsync;
async function readAndroidManifestAsync(manifestPath) {
    const xml = await XML.readXMLAsync({ path: manifestPath });
    if (!isManifest(xml)) {
        throw new Error('Invalid manifest found at: ' + manifestPath);
    }
    return xml;
}
exports.readAndroidManifestAsync = readAndroidManifestAsync;
function isManifest(xml) {
    // TODO: Maybe more validation
    return !!xml.manifest;
}
/** Returns the `manifest.application` tag ending in `.MainApplication` */
function getMainApplication(androidManifest) {
    return (androidManifest?.manifest?.application?.filter((e) => e?.$?.['android:name'].endsWith('.MainApplication'))[0] ?? null);
}
exports.getMainApplication = getMainApplication;
function getMainApplicationOrThrow(androidManifest) {
    const mainApplication = getMainApplication(androidManifest);
    (0, assert_1.default)(mainApplication, 'AndroidManifest.xml is missing the required MainApplication element');
    return mainApplication;
}
exports.getMainApplicationOrThrow = getMainApplicationOrThrow;
function getMainActivityOrThrow(androidManifest) {
    const mainActivity = getMainActivity(androidManifest);
    (0, assert_1.default)(mainActivity, 'AndroidManifest.xml is missing the required MainActivity element');
    return mainActivity;
}
exports.getMainActivityOrThrow = getMainActivityOrThrow;
function getRunnableActivity(androidManifest) {
    // Get enabled activities
    const enabledActivities = androidManifest?.manifest?.application?.[0]?.activity?.filter?.((e) => e.$['android:enabled'] !== 'false' && e.$['android:enabled'] !== false);
    if (!enabledActivities) {
        return null;
    }
    // Get the activity that has a runnable intent-filter
    for (const activity of enabledActivities) {
        if (Array.isArray(activity['intent-filter'])) {
            for (const intentFilter of activity['intent-filter']) {
                if (intentFilter.action?.find((action) => action.$['android:name'] === 'android.intent.action.MAIN') &&
                    intentFilter.category?.find((category) => category.$['android:name'] === 'android.intent.category.LAUNCHER')) {
                    return activity;
                }
            }
        }
    }
    return null;
}
exports.getRunnableActivity = getRunnableActivity;
function getMainActivity(androidManifest) {
    const mainActivity = androidManifest?.manifest?.application?.[0]?.activity?.filter?.((e) => e.$['android:name'] === '.MainActivity');
    return mainActivity?.[0] ?? null;
}
exports.getMainActivity = getMainActivity;
function addMetaDataItemToMainApplication(mainApplication, itemName, itemValue, itemType = 'value') {
    let existingMetaDataItem;
    const newItem = {
        $: prefixAndroidKeys({ name: itemName, [itemType]: itemValue }),
    };
    if (mainApplication['meta-data']) {
        existingMetaDataItem = mainApplication['meta-data'].filter((e) => e.$['android:name'] === itemName);
        if (existingMetaDataItem.length) {
            existingMetaDataItem[0].$[`android:${itemType}`] =
                itemValue;
        }
        else {
            mainApplication['meta-data'].push(newItem);
        }
    }
    else {
        mainApplication['meta-data'] = [newItem];
    }
    return mainApplication;
}
exports.addMetaDataItemToMainApplication = addMetaDataItemToMainApplication;
function removeMetaDataItemFromMainApplication(mainApplication, itemName) {
    const index = findMetaDataItem(mainApplication, itemName);
    if (mainApplication?.['meta-data'] && index > -1) {
        mainApplication['meta-data'].splice(index, 1);
    }
    return mainApplication;
}
exports.removeMetaDataItemFromMainApplication = removeMetaDataItemFromMainApplication;
function findApplicationSubItem(mainApplication, category, itemName) {
    const parent = mainApplication[category];
    if (Array.isArray(parent)) {
        const index = parent.findIndex((e) => e.$['android:name'] === itemName);
        return index;
    }
    return -1;
}
function findMetaDataItem(mainApplication, itemName) {
    return findApplicationSubItem(mainApplication, 'meta-data', itemName);
}
exports.findMetaDataItem = findMetaDataItem;
function findUsesLibraryItem(mainApplication, itemName) {
    return findApplicationSubItem(mainApplication, 'uses-library', itemName);
}
exports.findUsesLibraryItem = findUsesLibraryItem;
function getMainApplicationMetaDataValue(androidManifest, name) {
    const mainApplication = getMainApplication(androidManifest);
    if (mainApplication?.hasOwnProperty('meta-data')) {
        const item = mainApplication?.['meta-data']?.find((e) => e.$['android:name'] === name);
        return item?.$['android:value'] ?? null;
    }
    return null;
}
exports.getMainApplicationMetaDataValue = getMainApplicationMetaDataValue;
function addUsesLibraryItemToMainApplication(mainApplication, item) {
    let existingMetaDataItem;
    const newItem = {
        $: prefixAndroidKeys(item),
    };
    if (mainApplication['uses-library']) {
        existingMetaDataItem = mainApplication['uses-library'].filter((e) => e.$['android:name'] === item.name);
        if (existingMetaDataItem.length) {
            existingMetaDataItem[0].$ = newItem.$;
        }
        else {
            mainApplication['uses-library'].push(newItem);
        }
    }
    else {
        mainApplication['uses-library'] = [newItem];
    }
    return mainApplication;
}
exports.addUsesLibraryItemToMainApplication = addUsesLibraryItemToMainApplication;
function removeUsesLibraryItemFromMainApplication(mainApplication, itemName) {
    const index = findUsesLibraryItem(mainApplication, itemName);
    if (mainApplication?.['uses-library'] && index > -1) {
        mainApplication['uses-library'].splice(index, 1);
    }
    return mainApplication;
}
exports.removeUsesLibraryItemFromMainApplication = removeUsesLibraryItemFromMainApplication;
function prefixAndroidKeys(head) {
    // prefix all keys with `android:`
    return Object.entries(head).reduce((prev, [key, curr]) => ({ ...prev, [`android:${key}`]: curr }), {});
}
exports.prefixAndroidKeys = prefixAndroidKeys;
/**
 * Ensure the `tools:*` namespace is available in the manifest.
 *
 * @param manifest AndroidManifest.xml
 * @returns manifest with the `tools:*` namespace available
 */
function ensureToolsAvailable(manifest) {
    return ensureManifestHasNamespace(manifest, {
        namespace: 'xmlns:tools',
        url: 'http://schemas.android.com/tools',
    });
}
exports.ensureToolsAvailable = ensureToolsAvailable;
/**
 * Ensure a particular namespace is available in the manifest.
 *
 * @param manifest `AndroidManifest.xml`
 * @returns manifest with the provided namespace available
 */
function ensureManifestHasNamespace(manifest, { namespace, url }) {
    if (manifest?.manifest?.$?.[namespace]) {
        return manifest;
    }
    manifest.manifest.$[namespace] = url;
    return manifest;
}
