package abi48_0_0.expo.modules.intentlauncher.exceptions

import abi48_0_0.expo.modules.core.errors.CodedException

class ActivityAlreadyStartedException :
  CodedException("IntentLauncher activity is already started. You need to wait for its result before starting another activity.") {
  override fun getCode(): String {
    return "E_ACTIVITY_ALREADY_STARTED"
  }
}
