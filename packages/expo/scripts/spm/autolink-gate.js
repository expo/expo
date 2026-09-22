/**
 * The gate a product's `autolinkWhen` declares in its spm.config.json: whether
 * the product is linked into this install at all. expo-camera's barcode scanner
 * is the one shipping today —
 * `{ "podfileProperty": "expo.camera.barcode-scanner-enabled", "disabledValue": "false" }`.
 *
 * A port of `companion_autolink_condition_met?` /
 * `companion_autolink_condition_label` in
 * expo-modules-autolinking/scripts/ios/precompiled_modules.rb, with the two
 * registries the Ruby consults replaced by their counterparts here: its
 * `pod_lookup_map`, every product declared by a scanned spm.config.json, is the
 * prebuilt-metadata document, built by scanning the same files; its React
 * Native config `dependencies` is the set of npm packages the app autolinks.
 */

'use strict';

/**
 * @param condition the product's `autolinkWhen`, or nothing.
 * @param declaredPodNames every pod name the install declares, whether or not
 * it is linked — membership must not depend on how far an emit loop has got.
 * @param autolinkedPackages npm package names the app autolinks.
 * @param podfileProperties `readPodfileProperties()` of the app.
 * @returns whether the product may be linked. The first key the condition
 * declares decides it, in the order below; a condition declaring none is never
 * met.
 */
function autolinkConditionMet(
  condition,
  { declaredPodNames, autolinkedPackages, podfileProperties } = {}
) {
  if (condition?.podName != null) return declaredPodNames?.has(condition.podName) === true;
  if (condition?.npmPackage != null) return autolinkedPackages?.has(condition.npmPackage) === true;
  if (condition?.podfileProperty != null) {
    // Opt-OUT: only the disabled value withholds the product, so an app that
    // never set the property gets it. Both sides collapse to null first, because
    // Ruby reads an unset property and an undeclared value as the same nil —
    // leaving them apart would link a product here that CocoaPods withholds.
    return (
      (podfileProperties?.[condition.podfileProperty] ?? null) !== (condition.disabledValue ?? null)
    );
  }
  return false;
}

/** What to call the condition in a diagnostic: the key that decides it. */
function autolinkConditionLabel(condition) {
  return condition?.podName ?? condition?.npmPackage ?? condition?.podfileProperty ?? null;
}

module.exports = { autolinkConditionLabel, autolinkConditionMet };
