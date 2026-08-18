import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("NetworkPath")
struct NetworkPathTests {
  @Test
  func `interface type defaults to none when not satisfied`() {
    let path = NetworkPath(
      status: .unsatisfied,
      interfaceType: .none,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: .notAvailable,
      timestamp: 0
    )
    #expect(path.interfaceType == .none)
  }

  @Test
  func `equatable on identical values`() {
    let now: TimeInterval = 1.0
    let lhs = NetworkPath(
      status: .satisfied,
      interfaceType: .wifi,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: now
    )
    let rhs = NetworkPath(
      status: .satisfied,
      interfaceType: .wifi,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: now
    )
    #expect(lhs == rhs)
  }

  @Test
  func `equatable distinguishes interface type`() {
    let wifi = NetworkPath(
      status: .satisfied,
      interfaceType: .wifi,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: 0
    )
    let cellular = NetworkPath(
      status: .satisfied,
      interfaceType: .cellular,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: 0
    )
    #expect(wifi != cellular)
  }
}

@AppMetricsActor
@Suite("NetworkPathMonitor")
struct NetworkPathMonitorTests {
  @Test
  func `caches the last received path`() {
    let monitor = NetworkPathMonitor()
    let path = NetworkPath(
      status: .satisfied,
      interfaceType: .wifi,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: 1.0
    )
    monitor.apply(path)
    #expect(monitor.currentPath == path)
  }

  @Test
  func `overwrites the cached path on subsequent updates`() {
    let monitor = NetworkPathMonitor()
    let first = NetworkPath(
      status: .satisfied,
      interfaceType: .wifi,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: 1.0
    )
    let second = NetworkPath(
      status: .unsatisfied,
      interfaceType: .none,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: .notAvailable,
      timestamp: 2.0
    )
    monitor.apply(first)
    monitor.apply(second)
    #expect(monitor.currentPath == second)
  }

  @Test
  func `waitForFirstPath returns immediately when a path is already cached`() async {
    let monitor = NetworkPathMonitor()
    let path = NetworkPath(
      status: .satisfied,
      interfaceType: .wifi,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: 1.0
    )
    monitor.apply(path)
    let result = await monitor.waitForFirstPath()
    #expect(result == path)
  }
}
