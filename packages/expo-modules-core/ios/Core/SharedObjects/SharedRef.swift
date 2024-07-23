/**
 Shared object that holds a reference to any native object. Allows passing references
 to native instances among different independent libraries.
 */
open class SharedRef<RefType>: SharedObject {
  public let ref: RefType

  @available(*, deprecated, renamed: "ref", message: "it has been renamed to 'ref' in Expo SDK 52")
  public var pointer: RefType {
    return ref
  }

  public init(_ ref: RefType) {
    self.ref = ref
    super.init()
  }
}
