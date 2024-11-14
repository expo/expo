public protocol AnySharedRef {
  /**
   A type of the native reference. It can be used to distinguish between different SharedRefs in the JavaScript.
   */
  var nativeRefType: String { get }
}

/**
 Shared object that holds a reference to any native object. Allows passing references
 to native instances among different independent libraries.
 */
open class SharedRef<RefType>: SharedObject, AnySharedRef {
  public var ref: RefType

  open var nativeRefType: String {
    "unknown"
  }

  @available(*, deprecated, renamed: "ref", message: "it has been renamed to 'ref' in Expo SDK 52")
  public var pointer: RefType {
    return ref
  }

  public init(_ ref: RefType) {
    self.ref = ref
    super.init()
  }
}
