package expo.modules.kotlin.sharedobjects

/**
 * Shared object (ref) that holds a strong reference to any native object. Allows passing references
 * to native instances among different independent libraries.
 */
open class SharedRef<RefType>(val ref: RefType) : SharedObject()
