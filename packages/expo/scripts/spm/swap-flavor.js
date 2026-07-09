/**
 * Flavored-artifact DECLARATIONS for React Native's SwiftPM flavor swap.
 *
 * SwiftPM can't branch a `.binaryTarget(path:)` on $CONFIGURATION, so the generated
 * precompiled packages point their binaryTargets at a stable
 * `artifacts/<Name>.xcframework` symlink. The plugin declares each symlink and its
 * per-flavor targets via `flavoredArtifacts` in the plugin result; RN records them to
 * `build/generated/autolinking/.spm-plugin-flavored-artifacts.json` and its own
 * build-time swap (`react-native spm swap-flavor` + the appended
 * 'Fix SPM Embedded Flavor' phase) repoints/rsyncs them alongside React/Hermes —
 * including the deterministic post-embed fix, so plugin artifacts inherit RN's
 * timing guarantees. This module only DESCRIBES the artifacts; it performs no swap.
 */

'use strict';

/**
 * Rewrite a flavor-specific precompile path to the desired flavor by swapping the
 * `/output/<flavor>/xcframeworks/` segment. Returns the rewritten path, or null if
 * the path doesn't look like a precompile output path.
 */
function rewriteFlavorInPath(targetPath, desiredFlavor) {
  const rx = /\/output\/(debug|release)\/xcframeworks\//;
  if (!rx.test(targetPath)) return null;
  return targetPath.replace(rx, `/output/${desiredFlavor}/xcframeworks/`);
}

/**
 * Describe a flavored artifact for RN's plugin contract (`flavoredArtifacts` in the
 * plugin result): the stable symlink binaryTargets reference, plus the per-flavor
 * xcframework paths it can be repointed to. Flavors whose path can't be derived are
 * omitted; the consumer treats a missing flavor as "not built" and warns.
 */
function describeFlavoredArtifact(name, link, xcframeworkPath) {
  const flavors = {};
  for (const flavor of ['debug', 'release']) {
    const flavorPath = rewriteFlavorInPath(xcframeworkPath, flavor);
    if (flavorPath != null) {
      flavors[flavor] = flavorPath;
    }
  }
  return { name, link, flavors };
}

module.exports = {
  rewriteFlavorInPath,
  describeFlavoredArtifact,
};
