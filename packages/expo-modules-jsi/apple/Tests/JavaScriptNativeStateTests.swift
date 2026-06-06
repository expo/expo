import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct JavaScriptNativeStateTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `initially does not have native state`() {
    let object = runtime.createObject()
    #expect(object.hasNativeState() == false)
  }

  @Test
  func `getNativeState is nil when no native state is set`() {
    let object = runtime.createObject()
    #expect(object.getNativeState() == nil)
  }

  @Test
  func `sets base native state`() {
    let object = runtime.createObject()
    let nativeState = JavaScriptNativeState()
    object.setNativeState(nativeState)
    #expect(object.hasNativeState() == true)
    #expect(object.getNativeState() === nativeState)
  }

  @Test
  func `sets custom native state`() {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    object.setNativeState(nativeState)
    #expect(object.hasNativeState() == true)
    #expect(object.getNativeState() === nativeState)
    #expect(object.getNativeState(as: CustomNativeState.self)?.hello == "world")
  }

  @Test
  func `getNativeState is nil for unrelated type`() {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    object.setNativeState(nativeState)
    #expect(object.getNativeState(as: CustomNativeState.self) === nativeState)
    #expect(object.getNativeState(as: OtherNativeState.self) == nil)
  }

  @Test
  func `unsets native state`() throws {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    object.setNativeState(nativeState)
    #expect(object.hasNativeState() == true)
    object.unsetNativeState()
    #expect(object.hasNativeState() == false)
    #expect(object.getNativeState() == nil)
  }

  @Test
  func `shares native state between objects`() {
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    object1.setNativeState(nativeState)
    object2.setNativeState(nativeState)
    #expect(object1.hasNativeState() == true)
    #expect(object2.hasNativeState() == true)
    #expect(object1.getNativeState() === object2.getNativeState())
  }

  @Test
  func `reattaches after the previous pointee was released`() throws {
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    object1.setNativeState(nativeState)
    object1.unsetNativeState()

    // Force garbage collection so the previous C++ pointee is dropped.
    try runtime.eval("gc() && gc() && gc()")

    // Reattaching transparently materializes a fresh pointee.
    object2.setNativeState(nativeState)
    #expect(object2.hasNativeState() == true)
    #expect(object2.getNativeState() === nativeState)
  }

  // MARK: - Deallocator

  @Test
  func `sets deallocator on native state`() {
    let nativeState = CustomNativeState()
    nativeState.setDeallocator { _ in }
  }

  @Test
  func `deallocator is called when native state is unset`() throws {
    var deallocatorCalled = false
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    nativeState.setDeallocator { _ in
      deallocatorCalled = true
    }
    object.setNativeState(nativeState)
    object.unsetNativeState()

    // Force garbage collection
    try runtime.eval("gc() && gc() && gc()")

    #expect(deallocatorCalled == true)
  }

  @Test
  func `deallocator is called once when shared native state is released`() throws {
    var deallocatorCallCount = 0
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    nativeState.setDeallocator { _ in
      deallocatorCallCount += 1
    }
    object1.setNativeState(nativeState)
    object2.setNativeState(nativeState)

    // Unset from the first object — deallocator should not fire yet.
    object1.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
    #expect(deallocatorCallCount == 0)

    // Unset from the second object — now the deallocator should fire exactly once.
    object2.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
    #expect(deallocatorCallCount == 1)
  }

  @Test
  func `native state survives garbage collection while attached to a reachable object`() throws {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    object.setNativeState(nativeState)

    // GC shouldn't release the underlying C++ pointee while the JS object is reachable.
    try runtime.eval("gc() && gc() && gc()")

    #expect(object.getNativeState() === nativeState)
  }

  @Test
  func `getNativeState recovers the same instance from multiple objects`() {
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    object1.setNativeState(nativeState)
    object2.setNativeState(nativeState)

    #expect(object1.getNativeState() === nativeState)
    #expect(object2.getNativeState() === nativeState)
    #expect(object1.getNativeState(as: CustomNativeState.self)?.hello == "world")
  }

  @Test
  func `setting a different native state replaces the previous one`() {
    let object = runtime.createObject()
    let first = CustomNativeState()
    let second = CustomNativeState()
    object.setNativeState(first)
    object.setNativeState(second)

    #expect(object.getNativeState() === second)
    #expect(object.getNativeState() !== first)
  }

  @Test
  func `deallocator fires on each generation after re-attach`() throws {
    var deallocatorCallCount = 0
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    nativeState.setDeallocator { _ in
      deallocatorCallCount += 1
    }

    object1.setNativeState(nativeState)
    object1.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
    #expect(deallocatorCallCount == 1)

    // Re-attaching builds a new C++ pointee; the wrapper-level deallocator
    // remains set and must fire again when the new generation is released.
    object2.setNativeState(nativeState)
    #expect(object2.getNativeState() === nativeState)

    object2.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
    #expect(deallocatorCallCount == 2)
  }

  @Test
  func `wrapper survives loss of swift strong refs while attached to a reachable object`() throws {
    let object = runtime.createObject()
    weak var weakWrapper: CustomNativeState?

    do {
      let nativeState = CustomNativeState()
      weakWrapper = nativeState
      object.setNativeState(nativeState)
      // `nativeState` goes out of scope here. The retained Unmanaged context
      // baked into the C++ pointee is the only Swift-side strong reference.
    }

    try runtime.eval("gc() && gc() && gc()")

    // The wrapper is still alive because the C++ pointee (held by JSI's slot)
    // retains it via Unmanaged. `getNativeState` recovers it.
    #expect(weakWrapper != nil)
    #expect(object.getNativeState() === weakWrapper)

    // Once detached and GC'd, the C++ pointee dies, releases the Unmanaged,
    // and the Swift wrapper finally deallocates.
    object.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
    #expect(weakWrapper == nil)
  }

  @Test
  func `unsetting one of two sharers leaves the other intact`() throws {
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    object1.setNativeState(nativeState)
    object2.setNativeState(nativeState)

    object1.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")

    #expect(object1.hasNativeState() == false)
    #expect(object2.hasNativeState() == true)
    #expect(object2.getNativeState() === nativeState)
  }
}

final class CustomNativeState: JavaScriptNativeState {
  internal let hello: String = "world"
}

final class OtherNativeState: JavaScriptNativeState {}
