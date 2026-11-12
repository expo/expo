// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for applying decoded props to an Expo Modules v2 view on the main thread, as
/// `ExpoNativeViewObjC` does in `finalizeUpdates:`. Each operation applies the next decoded props of a
/// chain in which each decode changes one prop, through the Objective-C method that Fabric calls.
extension Benchmarks {
  @Test
  @MainActor
  func `native view: update 1 of 7 props`() throws {
    // The benchmark runs on this thread, the main thread, so the values don't cross threads.
    nonisolated(unsafe) let view = UpdateBenchmarkView(frame: .zero)
    nonisolated(unsafe) let chain = decodedPropsChain(count: 1_024)
    nonisolated(unsafe) let selector = NSSelectorFromString("updateDecodedProps:")
    nonisolated(unsafe) let update = unsafeBitCast(view.method(for: selector), to: UpdateDecodedPropsIMP.self)
    nonisolated(unsafe) var index = 0

    JavaScriptActor.assumeIsolated {
      benchmark("native view: update 1 of 7 props", runtime: nil) { iterations in
        MainActor.assumeIsolated {
          for _ in 0..<iterations {
            update(view, selector, chain[index])
            index = (index + 1) & (chain.count - 1)
          }
        }
      }
    }
    precondition(view.titleChanges > 0)
  }
}

private typealias UpdateDecodedPropsIMP = @convention(c) (AnyObject, Selector, AnyObject?) -> Void

/// Decoded props in which each decode changes one prop, `title` every 7th time.
private func decodedPropsChain(count: Int) -> [DecodedViewProps<UpdateBenchmarkProps>] {
  var chain: [DecodedViewProps<UpdateBenchmarkProps>] = []
  var props = UpdateBenchmarkProps()
  var previous: DecodedViewProps<UpdateBenchmarkProps>?

  for i in 0..<count {
    let changed: UpdateBenchmarkProps.PropSet
    switch i % 7 {
    case 0:
      props.title = "Title \(i)"
      changed = .title
    case 1:
      props.subtitle = "Subtitle \(i)"
      changed = .subtitle
    case 2:
      props.color = "#\(i)"
      changed = .color
    case 3:
      props.progress = Double(i)
      changed = .progress
    case 4:
      props.radius = Double(i)
      changed = .radius
    case 5:
      props.count = i
      changed = .count
    default:
      props.enabled.toggle()
      changed = .enabled
    }
    let decoded = DecodedViewProps(props: props, changedProps: changed, previous: previous)
    chain.append(decoded)
    previous = decoded
  }
  return chain
}

@ViewProps
private struct UpdateBenchmarkProps {
  var title = ""
  var subtitle = ""
  var color = ""
  var progress = 0.0
  var radius = 0.0
  var count = 0
  var enabled = false
}

@ExpoView<UpdateBenchmarkProps>
private final class UpdateBenchmarkView: ExpoNativeView {
  var titleChanges = 0
  var lastProgress = 0.0

  func didUpdateProps(_ diff: UpdateBenchmarkProps.Diff) {
    if diff.changed(.title) {
      titleChanges += 1
    }
    if diff.changed(.progress) {
      lastProgress = props.progress
    }
  }
}
