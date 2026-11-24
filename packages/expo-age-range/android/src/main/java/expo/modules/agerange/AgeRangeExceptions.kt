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

internal class FakeAgeSignalsNotDebuggableException : CodedException(
  "ERR_AGE_RANGE_FAKE_SIGNALS_NOT_DEBUGGABLE",
  "Cannot fake age signals in a build that is not debuggable, because faked signals would let any code in the app bypass your age gating. Test other age ranges in a debug build, and remove the `setFakeAgeSignals` call from the code you release.",
  null
)
