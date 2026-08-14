package expo.modules.agerange

import expo.modules.kotlin.exception.CodedException

internal class AgeRangeTaskCancelledException : CodedException(
  "ERR_AGE_RANGE_TASK_CANCELLED",
  "Age range task cancelled.",
  null
)

internal class FakeAgeSignalsConflictException : CodedException(
  "ERR_AGE_RANGE_FAKE_SIGNALS_CONFLICT",
  "Cannot fake an error and a response at the same time. Set `errorCode` or the age signals, not both.",
  null
)
