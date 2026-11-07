import Foundation

protocol ScheduledWork {
  func cancel()
}

protocol Scheduler: Sendable {
  func async(_ work: @escaping @Sendable () -> Void)
  func schedule(after delay: TimeInterval, _ work: @escaping @Sendable () -> Void) -> any ScheduledWork
}

extension DispatchWorkItem: ScheduledWork {}

final class DispatchScheduler: Scheduler {
  private let queue = DispatchQueue(label: "expo.modules.mediasession.coordinator", qos: .userInitiated)

  func async(_ work: @escaping @Sendable () -> Void) {
    queue.async(execute: work)
  }

  func schedule(after delay: TimeInterval, _ work: @escaping @Sendable () -> Void) -> any ScheduledWork {
    let item = DispatchWorkItem(block: work)
    queue.asyncAfter(deadline: .now() + delay, execute: item)
    return item
  }
}
