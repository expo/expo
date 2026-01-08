internal import ExpoBrownfieldModule

public struct BrownfieldMessaging {
  @discardableResult
  public static func addListener(_ callback: @escaping ([String: Any?]) -> Void) -> String {
    return BrownfieldMessagingInternal.shared.addListener(callback)
  }

  public static func removeListener(id: String) {
    BrownfieldMessagingInternal.shared.removeListener(id: id)
  }

  public static func sendMessage(_ message: [String: Any?]) {
    BrownfieldMessagingInternal.shared.sendMessage(message)
  }
}
