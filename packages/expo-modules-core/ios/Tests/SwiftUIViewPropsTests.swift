// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoModulesCore

/**
 A class rather than a struct, so that decoding it again produces a new instance and `===` tells a
 preserved value apart from a freshly decoded one.
 */
private final class Marker: Record {
  @Field var text: String?

  init() {}
}

private final class TestViewProps: ExpoSwiftUI.ViewProps {
  @Field var marker: Marker?
  @Field var title: String?
}

private final class EventTestViewProps: ExpoSwiftUI.ViewProps {
  let onRequestItems = EventDispatcher()
  let renamedEvent = EventDispatcher("onRenamed")
}

// swiftlint:disable legacy_objc_type
private func makeRawProps(markerText: String = "marker", title: String = "hello") -> [String: Any] {
  return [
    "marker": ["text": markerText] as NSDictionary,
    "title": title as NSString
  ]
}
// swiftlint:enable legacy_objc_type

@Suite("ExpoSwiftUI.ViewProps")
struct SwiftUIViewPropsTests {
  let appContext = AppContext.create()

  @Test @MainActor
  func `routes ordinary and urgent events separately without changing their payload`() {
    let props = EventTestViewProps()
    var ordinaryEvents: [String] = []
    var urgentEvents: [String] = []
    var requestedKey: String?
    var observerCalls = 0
    props.setUpEvents({ name, _ in
      ordinaryEvents.append(name)
    }, synchronous: { name, payload in
      urgentEvents.append(name)
      requestedKey = (payload as? [String: Any])?["key"] as? String
    })
    props.onRequestItems.onEventSent = { _ in observerCalls += 1 }

    props.onRequestItems(["key": "prefetch"])
    #expect(ordinaryEvents == ["onRequestItems"])
    #expect(urgentEvents.isEmpty)

    props.onRequestItems.experimentalRequestSynchronous(["key": "visible"])
    #expect(ordinaryEvents == ["onRequestItems"])
    #expect(urgentEvents == ["onRequestItems"])
    #expect(requestedKey == "visible")
    #expect(observerCalls == 2)
  }

  @Test @MainActor
  func `preserves custom and inherited global event names on the urgent path`() {
    let props = EventTestViewProps()
    var events: [String] = []
    props.setUpEvents({ _, _ in
      Issue.record("An urgent event must not fall back to ordinary dispatch")
    }, synchronous: { name, _ in
      events.append(name)
    })

    props.renamedEvent.experimentalRequestSynchronous([:])
    props.globalEventDispatcher.experimentalRequestSynchronous([:])
    #expect(events == ["onRenamed", GLOBAL_EVENT_NAME])
  }

  @Test
  func `keeps the decoded value when its raw value is unchanged`() throws {
    let props = TestViewProps()
    try props.updateRawProps(makeRawProps(), appContext: appContext)
    let firstMarker = props.marker
    #expect(firstMarker != nil)

    // Only `title` changes. `marker` arrives as an equal but freshly allocated dictionary.
    try props.updateRawProps(makeRawProps(title: "world"), appContext: appContext)

    #expect(props.marker === firstMarker)
    #expect(props.title == "world")
  }

  @Test
  func `decodes a field again when its raw value changes`() throws {
    let props = TestViewProps()
    try props.updateRawProps(makeRawProps(), appContext: appContext)
    let firstMarker = props.marker

    try props.updateRawProps(makeRawProps(markerText: "other"), appContext: appContext)

    #expect(props.marker !== firstMarker)
    #expect(props.marker?.text == "other")
  }
}
