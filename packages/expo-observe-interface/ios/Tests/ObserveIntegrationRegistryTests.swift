// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoObserveInterface

private final class TestIntegration: ObserveIntegration {
  let name: String

  init(name: String) {
    self.name = name
  }

  func setup(config: [String: Any], observe: any ObserveClient) throws -> (() -> Void)? {
    return nil
  }
}

private final class TestHost: ObserveIntegrationHost, @unchecked Sendable {
  private let lock = NSLock()
  private var registeredNames: [String] = []

  var names: [String] {
    return lock.withLock { registeredNames }
  }

  func register(_ integration: any ObserveIntegration) {
    lock.withLock {
      registeredNames.append(integration.name)
    }
  }
}

@Suite("ObserveIntegrationRegistry")
struct ObserveIntegrationRegistryTests {
  private let registry = ObserveIntegrationRegistry()
  private let host = TestHost()

  @Test
  func `passes the integrations registered before the host is set`() {
    registry.register(TestIntegration(name: "a"))
    registry.register(TestIntegration(name: "b"))
    #expect(host.names.isEmpty)

    registry.setHost(host)

    #expect(host.names == ["a", "b"])
  }

  @Test
  func `passes the integrations registered after the host is set`() {
    registry.setHost(host)
    registry.register(TestIntegration(name: "a"))

    #expect(host.names == ["a"])
  }

  @Test
  func `passes each integration once when they register from several threads`() async {
    let registry = registry
    let host = host
    await withTaskGroup(of: Void.self) { group in
      for index in 0..<100 {
        group.addTask {
          registry.register(TestIntegration(name: "\(index)"))
        }
      }
      group.addTask {
        registry.setHost(host)
      }
    }

    #expect(host.names.sorted() == (0..<100).map { "\($0)" }.sorted())
  }
}
