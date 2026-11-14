// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

@ViewProps
private struct DecoderTestProps {
  var title = "Untitled"
  var radius = 4.0
  var tint: String?
  var onTap: () -> Void
}

@Suite
@JavaScriptActor
struct ViewPropsDecoderTests {
  let runtime = JavaScriptRuntime()
  private let decoder = ViewPropsDecoder<DecoderTestProps>(viewName: "TestView")

  private func decode(
    _ source: String,
    previous: DecodedViewProps<DecoderTestProps>? = nil
  ) throws -> DecodedViewProps<DecoderTestProps>? {
    let props = try runtime.eval("(\(source))")
    return runtime.withUnsafePointee { runtimePointer in
      props.withUnsafePointee { propsPointer in
        decoder.decode(propsPointer: propsPointer, runtimePointer: runtimePointer, previous: previous)
      }
    }
  }

  /// Decodes two values of the given props, the way the component descriptor passes them after picking
  /// them out of the props object.
  private func decodeValues(
    _ first: (name: DecoderTestProps.PropName, source: String),
    _ second: (name: DecoderTestProps.PropName, source: String),
    previous: DecodedViewProps<DecoderTestProps>? = nil
  ) throws -> DecodedViewProps<DecoderTestProps>? {
    let firstValue = try runtime.eval("(\(first.source))")
    let secondValue = try runtime.eval("(\(second.source))")
    let indexes = [first.name, second.name].map { decoder.propNames.firstIndex(of: $0)! }

    return runtime.withUnsafePointee { runtimePointer in
      firstValue.withUnsafePointee { firstPointer in
        secondValue.withUnsafePointee { secondPointer in
          [firstPointer, secondPointer].withUnsafeBufferPointer { valuePointers in
            indexes.withUnsafeBufferPointer { indexes in
              decoder.decode(
                valuePointers: valuePointers.baseAddress!,
                indexes: indexes.baseAddress!,
                count: 2,
                runtimePointer: runtimePointer,
                previous: previous
              )
            }
          }
        }
      }
    }
  }

  @Test
  func `prop names follow the declaration order`() {
    #expect(decoder.propNameStrings == ["title", "radius", "tint"])
  }

  @Test
  func `decodes the values by the index of their prop name`() throws {
    let created = try #require(try decodeValues((.tint, "'red'"), (.title, "'Card'")))

    #expect(created.props.title == "Card")
    #expect(created.props.radius == 4)
    #expect(created.props.tint == "red")
  }

  @Test
  func `decoding values resets null props and keeps the props that don't decode`() throws {
    let created = try decode("{ title: 'Card', radius: 8, tint: 'red' }")
    let updated = try #require(try decodeValues((.tint, "null"), (.radius, "'large'"), previous: created))

    #expect(updated.props.title == "Card")
    #expect(updated.props.radius == 8)
    #expect(updated.props.tint == nil)
    #expect(updated.changedProps(since: created) == .tint)
  }

  @Test
  func `decoding values that don't decode returns the previous props`() throws {
    let created = try decode("{ title: 'Card', radius: 8 }")
    let updated = try decodeValues((.radius, "'large'"), (.radius, "'huge'"), previous: created)

    #expect(updated === created)
  }

  @Test
  func `generated init sets the defaults`() {
    let props = DecoderTestProps()

    #expect(props.title == "Untitled")
    #expect(props.radius == 4)
    #expect(props.tint == nil)
    #expect(DecoderTestProps._eventNames == ["onTap"])
    #expect(DecoderTestProps.PropName.allCases == [.title, .radius, .tint])
  }

  @Test
  func `decodes the props and skips other keys`() throws {
    let decoded = try #require(try decode("{ title: 'Card', tint: 'red', opacity: 0.5 }"))

    #expect(decoded.props.title == "Card")
    #expect(decoded.props.radius == 4)
    #expect(decoded.props.tint == "red")
    #expect(decoded.changedProps(since: nil) == DecoderTestProps.allProps)
  }

  @Test
  func `update keeps the props it doesn't have`() throws {
    let created = try decode("{ title: 'Card', radius: 8 }")
    let updated = try #require(try decode("{ title: 'New card' }", previous: created))

    #expect(updated.props.title == "New card")
    #expect(updated.props.radius == 8)
    #expect(updated.changedProps(since: created) == .title)
  }

  @Test
  func `null resets a prop to its default`() throws {
    let created = try decode("{ title: 'Card', tint: 'red' }")
    let updated = try #require(try decode("{ title: null, tint: null }", previous: created))

    #expect(updated.props.title == "Untitled")
    #expect(updated.props.tint == nil)
    #expect(updated.changedProps(since: created) == [.title, .tint])
  }

  @Test
  func `diff has the changed props and the old values`() throws {
    let created = try #require(try decode("{ title: 'Card', tint: 'red' }"))
    let updated = try #require(try decode("{ title: null, radius: 8 }", previous: created))
    let diff = DecoderTestProps.Diff(old: created, new: updated)

    #expect(diff.changed(.title))
    #expect(diff.changed(.radius))
    #expect(!diff.changed(.tint))
    #expect(diff.changedNames == [.title, .radius])
    #expect(diff.oldValue(\.title) == "Card")
    #expect(diff.newProps.title == "Untitled")
  }

  @Test
  func `update without props returns the previous props`() throws {
    let created = try decode("{ title: 'Card' }")
    let updated = try decode("{ opacity: 0.5 }", previous: created)

    #expect(updated === created)
  }

  @Test
  func `value that doesn't decode keeps the prop`() throws {
    let created = try decode("{ title: 'Card', radius: 8 }")
    let updated = try #require(try decode("{ title: 'New card', radius: 'large' }", previous: created))

    #expect(updated.props.title == "New card")
    #expect(updated.props.radius == 8)
    #expect(updated.changedProps(since: created) == .title)
  }

  @Test
  func `changed props add up over decodes that weren't mounted`() throws {
    let mounted = try decode("{ title: 'Card' }")
    let skipped = try decode("{ title: 'New card' }", previous: mounted)
    let latest = try #require(try decode("{ radius: 8 }", previous: skipped))

    #expect(latest.changedProps(since: mounted) == [.title, .radius])
    #expect(latest.changedProps(since: skipped) == .radius)
    #expect(latest.changedProps(since: latest).isEmpty)
  }

  @Test
  func `props of another lineage count as all changed`() throws {
    let other = try decode("{ title: 'Other' }")
    let decoded = try #require(try decode("{ title: 'Card' }"))

    #expect(decoded.changedProps(since: other) == DecoderTestProps.allProps)
  }

  @Test
  func `props from an unknown runtime are not decoded`() throws {
    let created = try decode("{ title: 'Card' }")
    let props = try runtime.eval("({ title: 'New card' })")
    var unknownRuntime = 0

    let updated = withUnsafePointer(to: &unknownRuntime) { runtimePointer in
      props.withUnsafePointee { propsPointer in
        decoder.decode(propsPointer: propsPointer, runtimePointer: UnsafeRawPointer(runtimePointer), previous: created)
      }
    }
    #expect(updated === created)
  }
}
