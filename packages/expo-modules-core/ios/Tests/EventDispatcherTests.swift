// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

private final class TwoEventsView {
  let onFirst = EventDispatcher()
  let onSecond = EventDispatcher()
}

@Suite("EventDispatcher")
struct EventDispatcherTests {
  @Test
  func `installs the dispatcher of the event when the remembered position is wrong`() {
    let view = TwoEventsView()
    let viewTypeId = ObjectIdentifier(TwoEventsView.self)
    eventDispatcherIndices.withLock { $0[viewTypeId] = ["onSecond": 0] }

    installEventDispatcher(forEvent: "onSecond", onView: view) { _ in }

    #expect(view.onFirst.handler == nil)
    #expect(view.onSecond.handler != nil)
    #expect(eventDispatcherIndices.withLock { $0[viewTypeId]?["onSecond"] } == 1)
  }
}
