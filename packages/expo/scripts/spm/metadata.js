/**
 * The prebuilt-metadata document, read once. Every entry is checked and filled in
 * here, so nothing downstream reads a raw entry or guesses at an absent field.
 */

'use strict';

const { prebuiltMetadata } = require('./cli');

/**
 * @typedef {{ exact: string } | { from: string } | { branch: string } | { revision: string }} PrebuiltSpmVersion
 * @typedef {{ url: string, productName: string, version: PrebuiltSpmVersion }} PrebuiltSpmPackage
 * @typedef {{ podName?: string, npmPackage?: string, podfileProperty?: string, disabledValue?: unknown }} PrebuiltAutolinkWhen
 */

/**
 * One pod's entry, with every field the plugin reads present. Mirrors
 * `PrebuiltMetadataEntry` in expo-modules-autolinking/src/prebuiltMetadata.ts,
 * less `type`, `npmPackage` and `podspecDir`, which nothing here reads.
 *
 * @typedef {object} PrebuiltMetadataRecord
 * @property {string} podName
 * @property {string | null} packageRoot
 * @property {string} productName the pod name where the entry names no product.
 * @property {boolean} sourceOnly
 * @property {string | null} iosDeploymentTarget
 * @property {PrebuiltSpmPackage[]} spmPackages
 * @property {PrebuiltAutolinkWhen | null} autolinkWhen
 */

const SPM_VERSION_KINDS = ['exact', 'from', 'branch', 'revision'];
const AUTOLINK_WHEN_SUBJECTS = ['podName', 'npmPackage', 'podfileProperty'];

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const isBoolean = (value) => typeof value === 'boolean';

function describeValue(value) {
  if (value === undefined) return 'nothing';
  if (Array.isArray(value)) return 'an array';
  return JSON.stringify(value);
}

// The producer validates every field it writes, so an entry that fails here was
// written by an expo-modules-autolinking other than the one this plugin ships with.
const REMEDY =
  'The plugin links each Expo module from this document, so it stops rather than guess. ' +
  'The document is the output of `expo-modules-autolinking prebuilt-metadata --json`; an entry it cannot have written usually means expo and expo-modules-autolinking come from different installs. ' +
  'Reinstall your JavaScript dependencies and sync again. If the entry is still unusable, report it at https://github.com/expo/expo/issues with the output of that command.';

function unusable(podName, field, expected, value) {
  return new Error(
    `[expo-spm-plugin] The prebuilt-metadata entry for pod ${podName} has an unusable ${field}: ` +
      `expected ${expected}, got ${describeValue(value)}. ${REMEDY}`
  );
}

/** An entry field, or `fallback` where the entry omits it. */
function optionalField(podName, entry, field, isValid, expected, fallback) {
  const value = entry[field];
  if (value == null) return fallback;
  if (!isValid(value)) throw unusable(podName, field, expected, value);
  return value;
}

/** The one requirement a version declares, or null when it declares none or several. */
function readSpmVersion(version) {
  if (!isObject(version)) return null;
  const declared = SPM_VERSION_KINDS.filter((kind) => kind in version);
  if (declared.length !== 1 || typeof version[declared[0]] !== 'string') return null;
  return { [declared[0]]: version[declared[0]] };
}

function readSpmPackages(podName, spmPackages) {
  if (spmPackages == null) return [];
  if (!Array.isArray(spmPackages)) {
    throw unusable(podName, 'spmPackages', 'an array', spmPackages);
  }
  return spmPackages.map((pkg, index) => {
    const field = `spmPackages[${index}]`;
    if (!isObject(pkg)) {
      throw unusable(podName, field, 'an object with url, productName and version', pkg);
    }
    if (!isNonEmptyString(pkg.url)) {
      throw unusable(podName, `${field}.url`, 'a package URL', pkg.url);
    }
    if (!isNonEmptyString(pkg.productName)) {
      throw unusable(podName, `${field}.productName`, 'a product name', pkg.productName);
    }
    const version = readSpmVersion(pkg.version);
    if (version == null) {
      throw unusable(
        podName,
        `${field}.version`,
        'exactly one of exact, from, branch or revision, as a string',
        pkg.version
      );
    }
    return { url: pkg.url, productName: pkg.productName, version };
  });
}

function readAutolinkWhen(podName, condition) {
  if (condition == null) return null;
  if (!isObject(condition)) throw unusable(podName, 'autolinkWhen', 'an object', condition);
  for (const subject of AUTOLINK_WHEN_SUBJECTS) {
    const value = condition[subject];
    if (value !== undefined && typeof value !== 'string') {
      throw unusable(podName, `autolinkWhen.${subject}`, 'a string', value);
    }
  }
  return condition;
}

/** @returns {PrebuiltMetadataRecord} */
function readEntry(podName, entry) {
  if (!isObject(entry)) {
    throw new Error(
      `[expo-spm-plugin] The prebuilt-metadata entry for pod ${podName} is not an object: got ${describeValue(entry)}. ${REMEDY}`
    );
  }
  const field = (name, isValid, expected, fallback) =>
    optionalField(podName, entry, name, isValid, expected, fallback);
  return {
    podName,
    packageRoot: field('packageRoot', isNonEmptyString, 'a directory path', null),
    productName: field('productName', isNonEmptyString, 'a product name', podName),
    sourceOnly: field('sourceOnly', isBoolean, 'true or false', false),
    iosDeploymentTarget: field('iosDeploymentTarget', isNonEmptyString, 'a version string', null),
    spmPackages: readSpmPackages(podName, entry.spmPackages),
    autolinkWhen: readAutolinkWhen(podName, entry.autolinkWhen),
  };
}

/**
 * The prebuilt-metadata document for the app at `appRoot`, by pod name.
 *
 * @returns {Map<string, PrebuiltMetadataRecord>}
 */
function readPrebuiltMetadata(appRoot) {
  const document = prebuiltMetadata(appRoot);
  if (!isObject(document)) {
    throw new Error(
      `[expo-spm-plugin] The prebuilt-metadata document is not an object keyed by pod name: got ${describeValue(document)}. ${REMEDY}`
    );
  }
  return new Map(
    Object.entries(document).map(([podName, entry]) => [podName, readEntry(podName, entry)])
  );
}

module.exports = { readPrebuiltMetadata };
