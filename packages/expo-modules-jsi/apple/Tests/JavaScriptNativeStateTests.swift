import Testing
import ExpoModulesJSI

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
  func `sets base native state`() throws {
    let object = runtime.createObject()
    let nativeState = JavaScriptNativeState()
    try object.setNativeState(nativeState)
    #expect(object.hasNativeState() == true)
    #expect(object.getNativeState() === nativeState)
  }

  @Test
  func `sets custom native state`() throws {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    try object.setNativeState(nativeState)
    #expect(object.hasNativeState() == true)
    #expect(object.getNativeState() === nativeState)
    #expect(object.getNativeState(as: CustomNativeState.self)?.hello == "world")
  }

  @Test
  func `getNativeState is nil for unrelated type`() throws {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    try object.setNativeState(nativeState)
    #expect(object.getNativeState(as: CustomNativeState.self) === nativeState)
    #expect(object.getNativeState(as: OtherNativeState.self) == nil)
  }

  @Test
  func `unsets native state`() throws {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    try object.setNativeState(nativeState)
    #expect(object.hasNativeState() == true)
    object.unsetNativeState()
    #expect(object.hasNativeState() == false)
    #expect(object.getNativeState() == nil)
  }

  @Test
  func `shares native state between objects`() throws {
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    try object1.setNativeState(nativeState)
    try object2.setNativeState(nativeState)
    #expect(object1.hasNativeState() == true)
    #expect(object2.hasNativeState() == true)
    #expect(object1.getNativeState() === object2.getNativeState())
  }

  @Test
  func `setNativeState throws when native state is released`() throws {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    try object.setNativeState(nativeState)

    // Unsetting releases the native state's underlying C++ object.
    object.unsetNativeState()

    // Force garbage collection
    try runtime.eval("gc() && gc() && gc()")

    #expect(nativeState.isReleased == true)
    #expect(throws: JavaScriptNativeState.NativeStateReleasedError.self) {
      try object.setNativeState(nativeState)
    }
  }

  // MARK: - Deallocator

  @Test
  func `sets deallocator on native state`() throws {
    let nativeState = CustomNativeState()
    try nativeState.setDeallocator { _ in }
  }

  @Test
  func `setDeallocator throws when native state is released`() throws {
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    try object.setNativeState(nativeState)

    // Release the native state by unsetting it from the object.
    object.unsetNativeState()

    // Force garbage collection
    try runtime.eval("gc() && gc() && gc()")

    #expect(nativeState.isReleased == true)
    #expect(throws: JavaScriptNativeState.NativeStateReleasedError.self) {
      try nativeState.setDeallocator { _ in }
    }
  }

  @Test
  func `deallocator is called when native state is unset`() throws {
    var deallocatorCalled = false
    let object = runtime.createObject()
    let nativeState = CustomNativeState()
    try nativeState.setDeallocator { _ in
      deallocatorCalled = true
    }
    try object.setNativeState(nativeState)
    object.unsetNativeState()

    // Force garbage collection
    try runtime.eval("gc() && gc() && gc()")

    #expect(deallocatorCalled == true)
  }

  // TODO: Fix setNativeState in JSIUtils.h to share a single std::shared_ptr across objects
  // instead of creating independent shared_ptrs from the same raw pointer.
  @Test(.disabled("Each setNativeState creates an independent shared_ptr — unsetting one deallocates immediately"))
  func `deallocator is called once when shared native state is released`() throws {
    var deallocatorCallCount = 0
    let object1 = runtime.createObject()
    let object2 = runtime.createObject()
    let nativeState = CustomNativeState()
    try nativeState.setDeallocator { _ in
      deallocatorCallCount += 1
    }
    try object1.setNativeState(nativeState)
    try object2.setNativeState(nativeState)

    // Unset from the first object — deallocator should not fire yet.
    object1.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
    #expect(deallocatorCallCount == 0)

    // Unset from the second object — now the deallocator should fire exactly once.
    object2.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
    #expect(deallocatorCallCount == 1)
  }
}

final class CustomNativeState: JavaScriptNativeState {
  internal let hello: String = "world"
}

final class OtherNativeState: JavaScriptNativeState {}
