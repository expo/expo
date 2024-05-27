package expo.modules.kotlin.sharedobjects

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext

/**
 * Shared object (ref) that holds a strong reference to any native object. Allows passing references
 * to native instances among different independent libraries.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
open class SharedRef<RefType>(val ref: RefType, appContext: AppContext? = null) :
  SharedObject(appContext)
