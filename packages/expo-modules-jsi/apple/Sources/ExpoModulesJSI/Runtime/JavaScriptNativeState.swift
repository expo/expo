internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 Base class for JS object's native state.
 */
open class JavaScriptNativeState {
  internal private(set) var pointee: expo.NativeState?

  public init() {
    // Get an opaque pointer to retained unmanaged instance.
    let ptr = Unmanaged.passRetained(self).toOpaque()

    // Function called when the underlying `expo.NativeState` deallocates,
    // e.g. when all JS objects using this native state gets garbage collected.
    func deallocate(context: UnsafeMutableRawPointer) {
      let unmanagedContext = Unmanaged<JavaScriptNativeState>.fromOpaque(context)
      let nativeState = unmanagedContext.takeUnretainedValue()

      // Release both C++ instance and unmanaged reference.
      nativeState.pointee = nil
      unmanagedContext.release()
    }

    // Create a native state in C++ that stores an opaque pointer to `self`.
    self.pointee = expo.NativeState(ptr, deallocate)
  }

  /**
   Checks whether the underlying native state has already been released.
   */
  public var isReleased: Bool {
    return pointee == nil
  }

  /**
   Turns given C++ `expo.NativeState` into its Swift counterpart.
   May return `nil` if the native state is of unrelated type.
   */
  internal static func from(cxx nativeState: expo.NativeState) -> Self? {
    // Get the opaque pointer stored by the C++ native state.
    let context = nativeState.getContext()
    // Turn it to unmanaged reference to base `NativeState` type as `fromOpaque` may crash for unrelated types.
    let value = Unmanaged<JavaScriptNativeState>.fromOpaque(context).takeUnretainedValue()
    // Then try to cast it to the proper type.
    return value as? Self
  }
}
