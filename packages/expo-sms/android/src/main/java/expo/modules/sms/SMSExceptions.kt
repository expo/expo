package expo.modules.sms

import expo.modules.kotlin.exception.CodedException

internal class MissingSMSAppException :
  CodedException("No messaging application available")
