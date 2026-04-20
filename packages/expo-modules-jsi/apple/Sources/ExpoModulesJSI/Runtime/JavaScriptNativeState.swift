internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 Base class for JS object's native state.
 */
open class JavaScriptNativeState {
  // Stored as an opaque pointer to avoid ARC retaining the bridged C++ type,
  // which could cause memory leaks due to unbalanced reference counting.
  private var _rawPointee: UnsafeMutableRawPointer?

  internal private(set) var pointee: expo.NativeState? {
    get {
      _rawPointee.map { Unmanaged<expo.NativeState>.fromOpaque($0).takeUnretainedValue() }
    }
    set {
      _rawPointee = newValue.map { Unmanaged.passUnretained($0).toOpaque() }
    }
  }

  public typealias Deallocator = (_ nativeState: JavaScriptNativeState) -> Void
  private var deallocator: Deallocator? = nil

  public init() {
    // Get an opaque pointer to retained unmanaged instance.
    let ptr = Unmanaged.passRetained(self).toOpaque()

    // Function called when the underlying `expo.NativeState` deallocates,
    // e.g. when all JS objects using this native state gets garbage collected.
    func deallocate(context: UnsafeMutableRawPointer) {
      let unmanagedContext = Unmanaged<JavaScriptNativeState>.fromOpaque(context)
      let nativeState = unmanagedContext.takeUnretainedValue()

      // Call the deallocator closure from Swift.
      nativeState.deallocator.take()?(nativeState)

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
   Sets a deallocator, a closure that is invoked when this native state is no longer attached to any JS object.
   Replaces any previously set deallocator.
   */
  public func setDeallocator(_ deallocator: @escaping Deallocator) throws(NativeStateReleasedError) {
    if isReleased {
      throw NativeStateReleasedError()
    }
    self.deallocator = deallocator
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

  // MARK: - Errors

  public struct NativeStateReleasedError: Error, CustomStringConvertible {
    public var description: String {
      return "Native state is already released"
    }
  }
}
