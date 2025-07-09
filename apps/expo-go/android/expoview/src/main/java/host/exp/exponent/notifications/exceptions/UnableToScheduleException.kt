package host.exp.exponent.notifications.exceptions

import expo.modules.core.errors.CodedException

class UnableToScheduleException : CodedException("Probably there won't be any time in the future when notification can be scheduled") {
  override fun getCode(): String {
    return "E_NOTIFICATION_CANNOT_BE_SCHEDULED"
  }
}
