package expo.modules.updates.statemachine

/**
All the possible states the machine can take.
 */
enum class UpdatesStateValue(val value: String) {
  Idle("idle"),
  Checking("checking"),
  Downloading("downloading"),
  Restarting("restarting")
}
