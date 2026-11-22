public struct SessionPauseReason: RawRepresentable, Hashable, Sendable {
  public let rawValue: String

  public init(rawValue: String) {
    self.rawValue = rawValue
  }

  public static let interruption = SessionPauseReason(rawValue: "interruption")
  public static let background = SessionPauseReason(rawValue: "background")
  public static let outputDisconnected = SessionPauseReason(rawValue: "outputDisconnected")
}

/// Called on the queue passed to `beginUse`, never after `end()` returns on that queue.
/// The module holds the delegate weakly.
public protocol SessionUseDelegate: AnyObject {
  func sessionUse(_ use: any SessionUse, pause reason: SessionPauseReason)
  func sessionUseResume(_ use: any SessionUse)
  func sessionUse(_ use: any SessionUse, duck isDucked: Bool)
  func sessionUse(_ use: any SessionUse, didFail error: Error)
  func sessionUseDidEnd(_ use: any SessionUse)
}
