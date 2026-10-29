import Foundation

/// Drops events the monitor has already delivered.
///
/// iOS re-delivers past events after the app returns to the foreground. Identifier plus date identifies one event.
@available(iOS 17, *)
final class DeliveredEvents {
  private var dates: [String: Date] = [:]

  func admit(_ event: MonitorEvent) -> Bool {
    guard dates[event.identifier] != event.date else {
      return false
    }
    dates[event.identifier] = event.date
    return true
  }
}
