// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoUI
@testable import ExpoModulesCore

@Suite("ListRenderWindow")
struct ListRenderWindowTests {
  @Test @MainActor
  func `coalesces key updates and appearance into one event with the latest keys`() async {
    let props = ListForEachProps()
    props.rowKeys = ["a", "b"]
    props.dataVersion = 1
    let window = ListRenderWindow()
    var events: [[String: Any]] = []
    props.onRenderWindowChange.onEventSent = { events.append($0) }

    // Both methods call schedule(), but only one main-queue block should be queued.
    window.updateKeys(props)
    window.appear("a", ready: true, props: props)
    #expect(events.isEmpty)

    // Run after the already-queued snapshot, without sleeping or guessing a delay.
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.main.async { continuation.resume() }
    }

    #expect(events.count == 1)
    #expect(events.first?["keys"] as? [String] == ["a"])
    #expect(events.first?["revision"] as? Int == 1)
    #expect(events.first?["dataVersion"] as? Int == 1)

    // The scheduled block deliberately holds these weakly; keep them alive for the test.
    withExtendedLifetime((window, props)) {}
  }

  @Test @MainActor
  func `reports no active keys when a row disappears before the scheduled event`() async {
    let props = ListForEachProps()
    props.rowKeys = ["a"]
    props.dataVersion = 1
    let window = ListRenderWindow()
    var events: [[String: Any]] = []
    props.onRenderWindowChange.onEventSent = { events.append($0) }

    window.updateKeys(props)
    window.appear("a", ready: true, props: props)
    // The row leaves before the queued snapshot gets a chance to run.
    window.disappear("a", props: props)
    #expect(events.isEmpty)

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.main.async { continuation.resume() }
    }

    #expect(events.count == 1)
    #expect(events.first?["keys"] as? [String] == [])
    #expect(events.first?["revision"] as? Int == 1)
    #expect(events.first?["dataVersion"] as? Int == 1)

    withExtendedLifetime((window, props)) {}
  }

  @Test @MainActor
  func `removes deleted keys and measurements while preserving surviving rows`() async {
    let props = ListForEachProps()
    props.rowKeys = ["a", "b"]
    props.dataVersion = 1
    let window = ListRenderWindow()
    var events: [[String: Any]] = []
    props.onRenderWindowChange.onEventSent = { events.append($0) }

    window.updateKeys(props)
    window.appear("a", ready: true, props: props)
    window.appear("b", ready: true, props: props)
    window.measure("a", size: CGSize(width: 320, height: 80))
    window.measure("b", size: CGSize(width: 320, height: 120))

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.main.async { continuation.resume() }
    }

    #expect(events.count == 1)
    #expect(Set(events.first?["keys"] as? [String] ?? []) == Set(["a", "b"]))
    #expect(window.height("a", width: 320) == 80)
    #expect(window.height("b", width: 320) == 120)

    // Delete a without an onDisappear callback: the dataset update must clean it up.
    props.rowKeys = ["b"]
    props.dataVersion = 2
    window.updateKeys(props)

    // Measurement cleanup is immediate; the window event is still scheduled.
    #expect(window.height("a", width: 320) == nil)
    #expect(window.height("b", width: 320) == 120)
    #expect(events.count == 1)

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.main.async { continuation.resume() }
    }

    #expect(events.count == 2)
    #expect(events.last?["keys"] as? [String] == ["b"])
    #expect(events.last?["revision"] as? Int == 2)
    #expect(events.last?["dataVersion"] as? Int == 2)

    withExtendedLifetime((window, props)) {}
  }

  @Test @MainActor
  func `requests each missing row urgently and follows with one newer window event`() async {
    let test = RenderWindowRecorder(keys: ["a", "b"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: false, props: test.props)
    test.window.appear("b", ready: false, props: test.props)

    // Urgent requests are not coalesced, even though the ordinary snapshot is.
    #expect(test.requests.count == 2)
    #expect(test.requests.first?["key"] as? String == "a")
    #expect(test.requests.first?["keys"] as? [String] == ["a"])
    #expect(test.requests.last?["key"] as? String == "b")
    #expect(Set(test.requests.last?["keys"] as? [String] ?? []) == Set(["a", "b"]))
    #expect(test.requests.map { $0["revision"] as? Int } == [1, 2])
    #expect(test.requests.allSatisfy { $0["dataVersion"] as? Int == 1 })
    #expect(test.snapshots.isEmpty)

    await test.flush()

    #expect(test.snapshots.count == 1)
    #expect(Set(test.snapshots.first?["keys"] as? [String] ?? []) == Set(["a", "b"]))
    #expect(test.snapshots.first?["revision"] as? Int == 3)
    #expect(test.snapshots.first?["dataVersion"] as? Int == 1)
  }

  @Test @MainActor
  func `deduplicates ready appearances without requesting content`() async {
    let test = RenderWindowRecorder(keys: ["a"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    test.window.appear("a", ready: true, props: test.props)
    await test.flush()

    #expect(test.requests.isEmpty)
    #expect(test.snapshots.count == 1)
    #expect(test.snapshots.first?["keys"] as? [String] == ["a"])
  }

  @Test @MainActor
  func `ignores missing requests for rows that never appeared or already disappeared`() async {
    let test = RenderWindowRecorder(keys: ["a", "b"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    test.window.disappear("a", props: test.props)
    await test.flush()
    let count = test.snapshots.count

    test.window.requestMissing("a", props: test.props)
    test.window.requestMissing("b", props: test.props)
    await test.flush()

    #expect(test.requests.isEmpty)
    #expect(test.snapshots.count == count)
  }

  @Test @MainActor
  func `requests content again when an active row loses its mounted content`() async {
    let test = RenderWindowRecorder(keys: ["a"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    await test.flush()

    // Simulate the content-availability onChange callback, without another appearance.
    test.window.requestMissing("a", props: test.props)
    #expect(test.requests.count == 1)
    #expect(test.requests.first?["key"] as? String == "a")
    #expect(test.requests.first?["keys"] as? [String] == ["a"])
    #expect(test.requests.first?["revision"] as? Int == 2)
    await test.flush()

    #expect(test.snapshots.count == 2)
    #expect(test.snapshots.last?["revision"] as? Int == 3)
  }

  @Test @MainActor
  func `skips key updates when the dataset version has not changed`() async {
    let test = RenderWindowRecorder(keys: ["a"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    test.window.measure("a", size: CGSize(width: 320, height: 80))
    await test.flush()

    test.window.updateKeys(test.props)
    test.window.updateKeys(test.props)
    await test.flush()

    #expect(test.snapshots.count == 1)
    #expect(test.window.height("a", width: 320) == 80)
  }

  @Test @MainActor
  func `preserves active rows and measurements when data is reordered or appended`() async {
    let test = RenderWindowRecorder(keys: ["a", "b"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    test.window.measure("a", size: CGSize(width: 320, height: 80))
    await test.flush()

    test.props.rowKeys = ["b", "a", "c"]
    test.props.dataVersion = 2
    test.window.updateKeys(test.props)
    await test.flush()

    #expect(test.snapshots.count == 2)
    // Updating data does not mark the appended row as appeared or request its content.
    #expect(test.snapshots.last?["keys"] as? [String] == ["a"])
    #expect(test.snapshots.last?["dataVersion"] as? Int == 2)
    #expect(test.window.height("a", width: 320) == 80)
    #expect(test.requests.isEmpty)
  }

  @Test @MainActor
  func `uses the latest dataset when keys change before a pending snapshot runs`() async {
    let test = RenderWindowRecorder(keys: ["a", "b"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    test.window.appear("b", ready: true, props: test.props)

    test.props.rowKeys = ["b"]
    test.props.dataVersion = 2
    test.window.updateKeys(test.props)
    await test.flush()

    #expect(test.snapshots.count == 1)
    #expect(test.snapshots.first?["keys"] as? [String] == ["b"])
    #expect(test.snapshots.first?["dataVersion"] as? Int == 2)
  }

  @Test @MainActor
  func `clears and refills data without keeping old measurements or stopping scheduling`() async {
    let test = RenderWindowRecorder(keys: ["a"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    test.window.measure("a", size: CGSize(width: 320, height: 80))
    await test.flush()

    test.props.rowKeys = []
    test.props.dataVersion = 2
    test.window.updateKeys(test.props)
    await test.flush()
    #expect(test.snapshots.last?["keys"] as? [String] == [])
    #expect(test.window.height("a", width: 320) == nil)

    test.props.rowKeys = ["a"]
    test.props.dataVersion = 3
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    await test.flush()

    #expect(test.snapshots.count == 3)
    #expect(test.snapshots.last?["keys"] as? [String] == ["a"])
    #expect(test.snapshots.map { $0["revision"] as? Int } == [1, 2, 3])
    #expect(test.snapshots.last?["dataVersion"] as? Int == 3)
    #expect(test.window.height("a", width: 320) == nil)
  }

  @Test @MainActor
  func `disappearance preserves the measured height for a later placeholder`() async {
    let test = RenderWindowRecorder(keys: ["a"])
    test.window.updateKeys(test.props)
    test.window.appear("a", ready: true, props: test.props)
    test.window.measure("a", size: CGSize(width: 320, height: 80))
    await test.flush()

    test.window.disappear("a", props: test.props)
    await test.flush()

    #expect(test.snapshots.count == 2)
    #expect(test.snapshots.last?["keys"] as? [String] == [])
    #expect(test.window.height("a", width: 320) == 80)
  }

  @Test
  func `reuses heights only at the measured width and replaces them after layout`() {
    let window = ListRenderWindow()
    #expect(window.height("a", width: 320) == nil)

    window.measure("a", size: CGSize(width: 320, height: 80))
    #expect(window.height("a", width: 320) == 80)
    #expect(window.height("a", width: 400) == nil)
    #expect(window.height("b", width: 320) == nil)

    window.measure("a", size: CGSize(width: 400, height: 100))
    #expect(window.height("a", width: 400) == 100)
    #expect(window.height("a", width: 320) == nil)

    window.measure("a", size: CGSize(width: 400, height: 140))
    #expect(window.height("a", width: 400) == 140)
  }

  @Test(arguments: [CGFloat.zero, -1, .nan, .infinity, -.infinity])
  func `ignores transient invalid widths without overwriting a valid measurement`(width: CGFloat) {
    let window = ListRenderWindow()
    window.measure("a", size: CGSize(width: 320, height: 80))
    window.measure("a", size: CGSize(width: width, height: 80))
    #expect(window.height("a", width: 320) == 80)
    window.measure("b", size: CGSize(width: width, height: 80))
    #expect(window.height("b", width: width) == nil)
  }

  @Test(arguments: [CGFloat.zero, -1, .nan, .infinity, -.infinity])
  func `ignores invalid heights without overwriting a valid measurement`(height: CGFloat) {
    let window = ListRenderWindow()
    window.measure("a", size: CGSize(width: 320, height: height))
    #expect(window.height("a", width: 320) == nil)

    window.measure("a", size: CGSize(width: 320, height: 80))
    window.measure("a", size: CGSize(width: 320, height: height))
    #expect(window.height("a", width: 320) == 80)
  }
}

// Records dispatch at the Expo boundary, without needing a Fabric surface or JS runtime.
@MainActor
private final class RenderWindowRecorder {
  let window = ListRenderWindow()
  let props = ListForEachProps()
  var requests: [[String: Any]] = []
  var snapshots: [[String: Any]] = []

  init(keys: [String]) {
    props.rowKeys = keys
    props.dataVersion = 1
    props.setUpEvents({ [weak self] name, payload in
      #expect(name == "onRenderWindowChange")
      if let payload = payload as? [String: Any] {
        self?.snapshots.append(payload)
      } else {
        Issue.record("Expected a dictionary event payload")
      }
    }, synchronous: { [weak self] name, payload in
      #expect(name == "onRequestItem")
      if let payload = payload as? [String: Any] {
        self?.requests.append(payload)
      } else {
        Issue.record("Expected a dictionary event payload")
      }
    })
  }

  func flush() async {
    // Main-queue FIFO ordering: resume only after previously scheduled snapshots run.
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.main.async { continuation.resume() }
    }
  }
}
