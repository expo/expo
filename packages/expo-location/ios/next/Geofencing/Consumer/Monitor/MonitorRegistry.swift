import Foundation

@available(iOS 17, *)
enum MonitorRegistry {
  private static let lock = NSLock()
  private static var monitors: [String: SharedMonitor] = [:]

  static func monitor(named name: String) -> SharedMonitor {
    lock.withLock {
      if let existing = monitors[name] {
        return existing
      }
      let created = SharedMonitor(name: name)
      monitors[name] = created
      return created
    }
  }
}
