package expo.modules.agerange

import expo.modules.kotlin.exception.CodedException

internal class AgeRangeTaskCancelledException : CodedException(
  "ERR_AGE_RANGE_TASK_CANCELLED",
  "Age range task cancelled.",
  null
)
