package expo.modules.sms

import expo.modules.kotlin.exception.CodedException

internal class MissingSMSAppException :
  CodedException("No messaging application available")

internal class MissingCurrentActivityException :
  CodedException("Activity which was provided during module initialization is no longer available")
