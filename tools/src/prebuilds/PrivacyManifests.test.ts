import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'path';

import { getPackagesDir } from '../Directories';

const PRIVACY_MANIFEST = 'PrivacyInfo.xcprivacy';

/**
 * A package joins the SwiftPM path by carrying either a config the generator reads
 * or a manifest it uses as-is. Packages with neither are still CocoaPods-only.
 */
const SWIFTPM_ENTRY_POINTS = ['spm.config.json', 'Package.swift'];

function readIfPresent(filePath: string): string | null {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function swiftPmSources(packageDir: string): string[] {
  return SWIFTPM_ENTRY_POINTS.map((name) => readIfPresent(path.join(packageDir, name))).filter(
    (contents): contents is string => contents != null
  );
}

describe('iOS privacy manifests', () => {
  it('are declared to SwiftPM by every package that ships one', () => {
    const packagesDir = getPackagesDir();

    const undeclared = fs
      .readdirSync(packagesDir)
      .filter((name) => fs.existsSync(path.join(packagesDir, name, 'ios', PRIVACY_MANIFEST)))
      .filter((name) => {
        const sources = swiftPmSources(path.join(packagesDir, name));
        return (
          sources.length > 0 && !sources.some((contents) => contents.includes(PRIVACY_MANIFEST))
        );
      });

    assert.deepEqual(
      undeclared,
      [],
      `These packages ship ios/${PRIVACY_MANIFEST} but never declare it to SwiftPM: ${undeclared.join(', ')}.\n` +
        `CocoaPods reads the declaration from the podspec's resource_bundles; the prebuild pipeline ` +
        `does not read podspecs, so the manifest is silently absent from every SwiftPM build. Nothing ` +
        `fails until App Store review rejects the upload (ITMS-91053).\n` +
        `Fix: add the manifest to the package's target in spm.config.json — ` +
        `"resources": [{ "path": "ios/${PRIVACY_MANIFEST}", "rule": "copy" }] — as ` +
        `packages/expo-application/spm.config.json does, or declare it in a checked-in Package.swift.`
    );
  });
});
