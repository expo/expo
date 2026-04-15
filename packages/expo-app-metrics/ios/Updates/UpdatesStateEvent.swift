struct UpdatesStateEvent {
  enum EventType: String, CaseIterable {
    case startStartup = "startStartup"
    case endStartup = "endStartup"
    case check = "check"
    case checkCompleteAvailable = "checkCompleteAvailable"
    case checkCompleteUnavailable = "checkCompleteUnavailable"
    case checkCompleteWithUpdate = "checkCompleteWithUpdate"
    case checkCompleteWithRollback = "checkCompleteWithRollback"
    case checkError = "checkError"
    case download = "download"
    case downloadComplete = "downloadComplete"
    case downloadCompleteWithUpdate = "downloadCompleteWithUpdate"
    case downloadCompleteWithRollback = "downloadCompleteWithRollback"
    case downloadError = "downloadError"
    case downloadProgress = "downloadProgress"
    case restart = "restart"
  }

  let type: EventType

  static func fromDict(_ dict: [String: Any]) -> UpdatesStateEvent? {
    guard let typeString = dict["type"] as? String else {
      return nil
    }
    for type in EventType.allCases {
      if type.rawValue == typeString {
        return UpdatesStateEvent(type: type)
      }
    }
    return nil
  }
}
