import Combine
import SwiftUI
internal import ExpoBrownfield

private final class SharedStateObserver<T>: ObservableObject {
  @Published var value: T?
  let key: String
  private var cancellable: AnyCancellable?

  init(key: String, initialValue: T?) {
    self.key = key
    let stored = BrownfieldState.get(key) as? T
    self.value = stored ?? initialValue
    if stored == nil, let initial = initialValue {
      BrownfieldState.set(key, initial)
    }
    cancellable = BrownfieldState.subscribe(key) { [weak self] newValue in
      let typed = newValue as? T
      DispatchQueue.main.async { self?.value = typed }
    }
  }
}

@propertyWrapper
public struct SharedState<T>: DynamicProperty {
  @StateObject private var observer: SharedStateObserver<T>

  public init(_ key: String, initialValue: T? = nil) {
    _observer = StateObject(wrappedValue: SharedStateObserver(key: key, initialValue: initialValue))
  }

  public var wrappedValue: T? {
    get { observer.value }
    nonmutating set { BrownfieldState.set(observer.key, newValue) }
  }

  public var projectedValue: Binding<T?> {
    Binding(
      get: { wrappedValue },
      set: { wrappedValue = $0 }
    )
  }
}
