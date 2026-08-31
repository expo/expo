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
