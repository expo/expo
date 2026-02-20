import Foundation

public typealias BrownfieldMessage = [String: Any?]
public typealias BrownfieldCallback = (BrownfieldMessage) -> Void

// MARK: - BrownfieldMessagingInternal

public class BrownfieldMessagingInternal {
  public static let shared = BrownfieldMessagingInternal()

  private var listeners: [String: BrownfieldCallback] = [:]
  private var expoModule: ExpoBrownfieldModule?

  private init() {}

  @discardableResult
  public func addListener(
    _ callback: @escaping BrownfieldCallback
  ) -> String {
    let id = UUID().uuidString
    listeners[id] = callback
    return id
  }

  public func removeListener(id: String) {
    listeners.removeValue(forKey: id)
  }

  public func sendMessage(_ message: BrownfieldMessage) {
    expoModule?.sendMessage(message)
  }

  func emit(_ message: BrownfieldMessage) {
    for listener in listeners.values {
      listener(message)
    }
  }

  func setExpoModule(_ expoModule: ExpoBrownfieldModule?) {
    self.expoModule = expoModule
  }
}
