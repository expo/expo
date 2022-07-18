// Copyright 2022-present 650 Industries. All rights reserved.

// Error codes for expo-updates logs

package expo.modules.updates.logging

enum class UpdatesErrorCode(val code: Int) {
  None(0),
  NoUpdatesAvailable(1),
  UpdateAssetsNotAvailable(2),
  UpdateServerUnreachable(3),
  UpdateHasInvalidSignature(4),
  UpdateFailedToLoad(5),
  AssetsFailedToLoad(6),
  JSRuntimeError(7);

  companion object {
    fun asString(code: UpdatesErrorCode): String {
      return when (code) {
        None -> "None"
        NoUpdatesAvailable -> "NoUpdatesAvailable"
        UpdateAssetsNotAvailable -> "UpdateAssetsNotAvailable"
        UpdateServerUnreachable -> "UpdateServerUnreachable"
        UpdateHasInvalidSignature -> "UpdateHasInvalidSignature"
        UpdateFailedToLoad -> "UpdateFailedToLoad"
        AssetsFailedToLoad -> "AssetsFailedToLoad"
        JSRuntimeError -> "JSRuntimeError"
      }
    }
  }
}
