import Testing
import Foundation

@testable import EXDevMenu

private func concurrently(_ count: Int, _ body: @escaping (Int) -> Void) {
  DispatchQueue.concurrentPerform(iterations: count) { index in
    body(index)
  }
}

// On reload, the outgoing context's OnDestroy resets the callback list while the incoming
// context's JS thread appends to it, so the registry is written from more than one thread.
@Suite("DevMenuCallbacksRegistry")
struct DevMenuCallbacksRegistryTests {
  @Test
  func `keeps the last replace when several threads replace at once`() {
    let registry = DevMenuCallbacksRegistry()

    concurrently(500) { index in
      registry.replace(with: [DevMenuManager.Callback(name: "callback-\(index)", shouldCollapse: true)])
    }

    #expect(registry.callbacks.count == 1)
  }

  @Test
  func `reads a consistent snapshot while writes are in flight`() {
    let registry = DevMenuCallbacksRegistry()
    let callbackNames = (0..<50).map { "callback-\($0)" }

    concurrently(callbackNames.count) { index in
      let name = callbackNames[index]
      registry.replace(with: [DevMenuManager.Callback(name: name, shouldCollapse: true)])
      #expect(registry.callbacks.count == 1)
    }
  }

  @Test
  func `starts out empty`() {
    let registry = DevMenuCallbacksRegistry()

    #expect(registry.callbacks.isEmpty)
  }
}
