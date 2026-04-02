import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct NativeStateTests {
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
  func `unsets native state`() {
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
}

final class CustomNativeState: JavaScriptNativeState {
  let hello: String = "world"
}

final class OtherNativeState: JavaScriptNativeState {}
