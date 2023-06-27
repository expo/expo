package abi49_0_0.expo.modules.sms

import abi49_0_0.expo.modules.kotlin.exception.CodedException

internal class MissingSMSAppException :
  CodedException("No messaging application available")

internal class MissingCurrentActivityException :
  CodedException("Activity which was provided during module initialization is no longer available")
