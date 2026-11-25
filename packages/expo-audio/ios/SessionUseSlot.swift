import ExpoMediaSession
import ExpoModulesCore

protocol SessionCommandTarget: AnyObject {
  func sessionPause(reason: SessionPauseReason)
  func sessionResume()
  func sessionDuck(_ isDucked: Bool)
  func sessionDidFail(_ error: Error)
  func sessionDidEnd()
}

/// Holds one component's current session use. Commands run on `queue`, so user actions that change the use
/// run there too, through `sync`. Never call `sync` from a command.
final class SessionUseSlot: SessionUseDelegate, @unchecked Sendable {
  let session: any MediaSessionManaging
  let queue: DispatchQueue
  var client = ""
  weak var target: SessionCommandTarget?
  private var use: (any SessionUse)?

  init(session: any MediaSessionManaging, label: String) {
    self.session = session
    self.queue = DispatchQueue(label: "expo.modules.audio.\(label)", qos: .userInitiated)
  }

  func sync<T>(_ body: () throws -> T) rethrows -> T {
    try queue.sync(execute: body)
  }

  // The methods below run on `queue`.

  var hasUse: Bool {
    use != nil
  }

  func isCurrent(_ use: any SessionUse) -> Bool {
    self.use === use
  }

  @discardableResult
  func begin(_ requirements: SessionRequirements) -> any SessionUse {
    let previous = use
    let next = session.beginUse(client: client, requirements: requirements, delegate: self, queue: queue)
    use = next
    previous?.end()
    return next
  }

  func end() {
    let previous = use
    use = nil
    previous?.end()
  }

  func end(ifCurrent use: any SessionUse) {
    if isCurrent(use) {
      end()
    }
  }

  func update(_ requirements: SessionRequirements) {
    use?.update(requirements)
  }

  func sessionUse(_ use: any SessionUse, pause reason: SessionPauseReason) {
    target?.sessionPause(reason: reason)
  }

  func sessionUseResume(_ use: any SessionUse) {
    target?.sessionResume()
  }

  func sessionUse(_ use: any SessionUse, duck isDucked: Bool) {
    target?.sessionDuck(isDucked)
  }

  func sessionUse(_ use: any SessionUse, didFail error: Error) {
    target?.sessionDidFail(error)
  }

  func sessionUseDidEnd(_ use: any SessionUse) {
    guard isCurrent(use) else {
      return
    }
    self.use = nil
    target?.sessionDidEnd()
  }
}
