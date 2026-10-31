package expo.modules.intentlauncher.exceptions

import expo.modules.kotlin.exception.CodedException

class ActivityAlreadyStartedException :
  CodedException(
    "E_ACTIVITY_ALREADY_STARTED",
    "IntentLauncher activity is already started. You need to wait for its result before starting another activity.",
    null
  )
