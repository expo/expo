package expo.modules.kotlin.sharedobjects

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.RuntimeContext

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
}
