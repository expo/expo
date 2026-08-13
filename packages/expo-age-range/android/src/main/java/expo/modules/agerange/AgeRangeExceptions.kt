package expo.modules.agerange

import expo.modules.kotlin.exception.CodedException

internal class AgeRangeTaskCancelledException : CodedException(
  "ERR_AGE_RANGE_TASK_CANCELLED",
  "Age range task cancelled.",
  null
)

internal class FakeAgeSignalsDisabledException : CodedException(
  "ERR_AGE_RANGE_FAKE_SIGNALS_DISABLED",
  "Fake age signals are not enabled for this build. Set the `$FAKE_AGE_SIGNALS_META_DATA` `meta-data` value to `true` in the AndroidManifest.xml of your app to enable them.",
  null
)

internal class InvalidFakeAgeSignalsException(
  field: String,
  value: String,
  allowedValues: Collection<String>
) : CodedException(
  "ERR_AGE_RANGE_INVALID_FAKE_SIGNALS",
  "Cannot fake age signals with `$field` set to `$value`. Expected one of ${allowedValues.joinToString { "`$it`" }}, or null.",
  null
)
