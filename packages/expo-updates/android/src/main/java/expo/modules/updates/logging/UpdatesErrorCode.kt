package expo.modules.updates.logging

/**
 * Error codes for expo-updates logs
 */
enum class UpdatesErrorCode(val code: String) {
  None("None"),
  NoUpdatesAvailable("NoUpdatesAvailable"),
  UpdateAssetsNotAvailable("UpdateAssetsNotAvailable"),
  UpdateServerUnreachable("UpdateServerUnreachable"),
  UpdateHasInvalidSignature("UpdateHasInvalidSignature"),
  UpdateCodeSigningError("UpdateCodeSigningError"),
  UpdateFailedToLoad("UpdateFailedToLoad"),
  AssetsFailedToLoad("AssetsFailedToLoad"),
  JSRuntimeError("JSRuntimeError"),
  InitializationError("InitializationError"),
  Unknown("Unknown")
}
