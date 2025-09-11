package expo.modules.kotlin.sharedobjects

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.RuntimeContext
import kotlin.reflect.KClass

/**
 * Shared object (ref) that holds a strong reference to any native object. Allows passing references
 * to native instances among different independent libraries.
 */
@DoNotStrip
open class SharedRef<RefType>(
  val ref: RefType,
  runtimeContext: RuntimeContext? = null
) : SharedObject(runtimeContext) {
  constructor(ref: RefType, appContext: AppContext) : this(ref, appContext.hostingRuntimeContext)

  /**
   * A type of the native reference. It can be used to distinguish between different SharedRefs in the JavaScript.
   */
  open val nativeRefType = "unknown"
}

@Suppress("UNCHECKED_CAST")
inline fun <reified RefType> SharedRef<*>.cast(): SharedRef<RefType>? {
  if (ref is RefType) {
    return this as SharedRef<RefType>
  }

  return null
}

fun KClass<*>.isSharedRefClass() =
  SharedRef::class.java.isAssignableFrom(this.java)
