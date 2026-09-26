/**
 * Port of `companion_autolink_condition_met?`/`_label` (precompiled_modules.rb); its
 * pod_lookup_map is the prebuilt-metadata document here.
 */

'use strict';

/**
 * First declared key decides (podName, npmPackage, podfileProperty); none → not met.
 * declaredPodNames = every DECLARED pod, not the ones emitted so far.
 */
function autolinkConditionMet(
  condition,
  { declaredPodNames, autolinkedPackages, podfileProperties } = {}
) {
  if (condition?.podName != null) return declaredPodNames?.has(condition.podName) === true;
  if (condition?.npmPackage != null) return autolinkedPackages?.has(condition.npmPackage) === true;
  if (condition?.podfileProperty != null) {
    // Opt-out; unset and undeclared both read as nil in Ruby.
    // Keeping them apart would link a product that CocoaPods withholds.
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
