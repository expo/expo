import Foundation

public typealias BrownfieldMessage = [String: Any?]
public typealias BrownfieldCallback = (BrownfieldMessage) -> Void

// MARK: - BrownfieldMessagingInternal

public class BrownfieldMessagingInternal {
  public static let shared = BrownfieldMessagingInternal()

  private let lock = NSLock()
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
    lock.lock()
    let module = expoModule
    lock.unlock()

    module?.sendMessage(message)
  }

  func emit(_ message: BrownfieldMessage) {
    for listener in listeners.values {
      listener(message)
    }
  }

  func setExpoModule(_ expoModule: ExpoBrownfieldModule) {
    lock.lock()
    self.expoModule = expoModule
    lock.unlock()
  }

  func clearExpoModule(_ expoModule: ExpoBrownfieldModule) {
    lock.lock()
    if self.expoModule === expoModule {
      self.expoModule = nil
    }
    lock.unlock()
  }
}
