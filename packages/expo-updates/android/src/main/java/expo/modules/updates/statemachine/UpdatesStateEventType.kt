package expo.modules.updates.statemachine

/**
All the possible types of events that can be sent to the machine. Each event
will cause the machine to transition to a new state.
 */
enum class UpdatesStateEventType(val type: String) {
  Check("check"),
  CheckCompleteUnavailable("checkCompleteUnavailable"),
  CheckCompleteAvailable("checkCompleteAvailable"),
  CheckError("checkError"),
  Download("download"),
  DownloadComplete("downloadComplete"),
  DownloadError("downloadError"),
  Restart("restart")
}
