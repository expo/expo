package abi47_0_0.expo.modules.updates.logging

/**
 * Error codes for expo-updates logs
 */
enum class UpdatesErrorCode(val code: String) {
  None("None"),
  NoUpdatesAvailable("NoUpdatesAvailable"),
  UpdateAssetsNotAvailable("UpdateAssetsNotAvailable"),
  UpdateServerUnreachable("UpdateServerUnreachable"),
  UpdateHasInvalidSignature("UpdateHasInvalidSignature"),
  UpdateFailedToLoad("UpdateFailedToLoad"),
  AssetsFailedToLoad("AssetsFailedToLoad"),
  JSRuntimeError("JSRuntimeError"),
  Unknown("Unknown")
}
