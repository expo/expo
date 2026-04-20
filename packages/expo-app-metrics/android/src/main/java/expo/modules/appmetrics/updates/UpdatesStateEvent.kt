package expo.modules.appmetrics.updates

data class UpdatesStateEvent(
  val type: EventType
) {
  enum class EventType(val value: String) {
    StartStartup("startStartup"),
    EndStartup("endStartup"),
    Check("check"),
    CheckCompleteAvailable("checkCompleteAvailable"),
    CheckCompleteUnavailable("checkCompleteUnavailable"),
    CheckCompleteWithUpdate("checkCompleteWithUpdate"),
    CheckCompleteWithRollback("checkCompleteWithRollback"),
    CheckError("checkError"),
    Download("download"),
    DownloadComplete("downloadComplete"),
    DownloadCompleteWithUpdate("downloadCompleteWithUpdate"),
    DownloadCompleteWithRollback("downloadCompleteWithRollback"),
    DownloadError("downloadError"),
    DownloadProgress("downloadProgress"),
    Restart("restart");
  }

  companion object {
    fun fromMap(map: Map<String, Any>): UpdatesStateEvent? {
      val typeString = map["type"] as? String ?: return null
      val type = EventType.entries.find { it.value == typeString } ?: return null
      return UpdatesStateEvent(type = type)
    }
  }
}
