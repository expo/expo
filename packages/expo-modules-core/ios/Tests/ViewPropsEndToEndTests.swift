// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

@ViewProps
private struct EndToEndProps {
  var title = "Untitled"
  var radius = 4.0
}

/// Runs props through the whole path that Fabric takes: `NewComponentDescriptor::cloneProps` in C++,
/// `ObjCPropsDecoder`, `ViewPropsDecoderAdapter` and `ViewPropsDecoder` in Swift.
@Suite
@JavaScriptActor
struct ViewPropsEndToEndTests {
  let runtime = JavaScriptRuntime()
  let descriptor = EXTestNewComponentDescriptor(
    decoder: ViewPropsDecoderAdapter(ViewPropsDecoder<EndToEndProps>(viewName: "EndToEndView"))
  )

  private func update(_ source: String) throws -> DecodedViewProps<EndToEndProps>? {
    let props = try runtime.eval("(\(source))")
    let decoded = runtime.withUnsafePointee { runtimePointer in
      props.withUnsafePointee { propsPointer in
        descriptor.update(runtime: runtimePointer, props: propsPointer)
      }
    }
    return decoded as? DecodedViewProps<EndToEndProps>
  }

  @Test
  func `create decodes the view props and parses the base view props`() throws {
    let created = try #require(try update("{ title: 'Card', opacity: 0.5 }"))

    #expect(created.props.title == "Card")
    #expect(created.props.radius == 4)
    #expect(created.changedProps(since: nil) == EndToEndProps.allProps)
    #expect(descriptor.opacity == 0.5)
  }

  @Test
  func `updates add up to the props changed since the mounted ones`() throws {
    let mounted = try update("{ title: 'Card' }")
    _ = try update("{ title: 'New card' }")
    let latest = try #require(try update("{ radius: 8, opacity: 0.5 }"))

    #expect(latest.props.title == "New card")
    #expect(latest.props.radius == 8)
    #expect(latest.changedProps(since: mounted) == [.title, .radius])

    let diff = PropsDiff(old: mounted, new: latest)
    #expect(diff.oldValue(\.title) == "Card")
    #expect(diff.newProps.title == "New card")
    #expect(diff.changedNames == [.title, .radius])
  }

  @Test
  func `removed prop goes back to its default`() throws {
    _ = try update("{ title: 'Card' }")
    let updated = try #require(try update("{ title: null }"))

    #expect(updated.props.title == "Untitled")
  }

  @Test
  func `update with only style props keeps the decoded props`() throws {
    let created = try update("{ title: 'Card' }")
    let updated = try update("{ opacity: 0.5 }")

    #expect(updated === created)
    #expect(descriptor.opacity == 0.5)
  }

  @Test
  func `decoded props are freed when the descriptor drops them`() throws {
    weak var created: DecodedViewProps<EndToEndProps>?
    weak var updated: DecodedViewProps<EndToEndProps>?
    try autoreleasepool {
      created = try update("{ title: 'Card' }")
      // A value that doesn't decode changes no prop, so the decoder passes `NULL` and the previous props stay.
      let unchanged = try update("{ title: 5 }")
      #expect(unchanged === created)
    }
    #expect(created != nil)

    try autoreleasepool {
      updated = try update("{ title: 'New card' }")
    }
    // The descriptor keeps only the latest props.
    #expect(created == nil)
    #expect(updated != nil)

    descriptor.reset()
    #expect(updated == nil)
  }

  @Test
  func `props without a runtime keep the decoded props`() throws {
    let created = try update("{ title: 'Card' }")
    let updated =
      descriptor.update(dynamicProps: ["title": "New card", "opacity": 0.5]) as? DecodedViewProps<EndToEndProps>

    #expect(updated === created)
    #expect(updated?.props.title == "Card")
    #expect(descriptor.opacity == 0.5)
  }
}
