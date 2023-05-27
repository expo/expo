/**
 Shared object (ref) that holds a pointer to any native object. Allows passing references
 to native instances among different independent libraries.
 */
open class SharedRef<PointerType>: SharedObject {
  public let pointer: PointerType

  init(_ pointer: PointerType) {
    self.pointer = pointer
    super.init()
  }
}
