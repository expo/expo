import Combine
import SwiftUI

internal final class SwiftUIState: ObservableObject {
  let id: Int
  @Published var value: Any?
  var onChange: ((Any?) -> Void)?

  init(id: Int, initialValue: Any?) {
    self.id = id
    self.value = initialValue
  }

  func binding<T>(as type: T.Type, default defaultValue: T) -> Binding<T> {
    Binding(
      get: { self.value as? T ?? defaultValue },
      set: { self.value = $0 }
    )
  }
}

internal final class SwiftUIStateRegistry {
  static let shared = SwiftUIStateRegistry()

  private let lock = NSLock()
  private var states: [Int: SwiftUIState] = [:]
  private var nextId: Int = 0

  func createState(initialValue: Any?) -> Int {
    lock.lock()
    defer { lock.unlock() }
    let id = nextId
    nextId += 1
    states[id] = SwiftUIState(id: id, initialValue: initialValue)
    return id
  }

  func getState(id: Int) -> SwiftUIState? {
    lock.lock()
    defer { lock.unlock() }
    return states[id]
  }

  func deleteState(id: Int) {
    lock.lock()
    defer { lock.unlock() }
    states.removeValue(forKey: id)
  }

  func getValue(id: Int) -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return states[id]?.value
  }

  func setValue(id: Int, value: Any?) {
    lock.lock()
    defer { lock.unlock() }
    states[id]?.value = value
  }

  func onChange(id: Int, callback: @escaping (Any?) -> Void) {
    lock.lock()
    defer { lock.unlock() }
    states[id]?.onChange = callback
  }

  func clear() {
    lock.lock()
    defer { lock.unlock() }
    states.removeAll()
  }
}
