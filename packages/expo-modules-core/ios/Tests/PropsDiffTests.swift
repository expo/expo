// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

/// Props written out by hand the way `@ViewProps` generates them.
private struct DiffTestProps: AnyViewProps {
  enum PropName: String, CaseIterable {
    case color
    case radius
    case title
  }

  struct PropSet: OptionSet, Sendable {
    let rawValue: UInt64

    static let color = PropSet(rawValue: 1 << 0)
    static let radius = PropSet(rawValue: 1 << 1)
    static let title = PropSet(rawValue: 1 << 2)
  }

  static let allProps = PropSet(rawValue: 0b111)
  static let _eventNames: [String] = []

  static func propSet(for name: PropName) -> PropSet {
    switch name {
    case .color:
      return .color
    case .radius:
      return .radius
    case .title:
      return .title
    }
  }

  var color = "red"
  var radius = 0.0
  var title = ""

  @JavaScriptActor
  mutating func _decode(
    _ name: PropName,
    from value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws {}
}

@Suite
struct PropsDiffTests {
  private func decoded(
    _ props: DiffTestProps = DiffTestProps(),
    changed: DiffTestProps.PropSet = [],
    previous: DecodedViewProps<DiffTestProps>? = nil
  ) -> DecodedViewProps<DiffTestProps> {
    return DecodedViewProps(props: props, changedProps: changed, previous: previous)
  }

  @Test
  func `first application changes all props`() {
    let diff = PropsDiff(old: nil, new: decoded())

    #expect(diff.isInitial)
    #expect(diff.changed(.color))
    #expect(diff.changed([.radius, .title]))
    #expect(diff.oldValue(\.color) == nil)
    #expect(diff.changedNames == [.color, .radius, .title])
  }

  @Test
  func `update changes only the given props`() {
    let old = decoded()
    var newProps = DiffTestProps()
    newProps.radius = 8
    let diff = PropsDiff(old: old, new: decoded(newProps, changed: .radius, previous: old))

    #expect(!diff.isInitial)
    #expect(diff.changed(.radius))
    #expect(!diff.changed(.color))
    #expect(diff.changed([.color, .radius]))
    #expect(!diff.changed([.color, .title]))
    #expect(diff.oldValue(\.radius) == 0)
    #expect(diff.newProps.radius == 8)
    #expect(diff.changedNames == [.radius])
  }

  @Test
  func `changed names keep the declaration order`() {
    let old = decoded()
    let diff = PropsDiff(old: old, new: decoded(changed: [.title, .color], previous: old))

    #expect(diff.changedNames == [.color, .title])
  }
}
