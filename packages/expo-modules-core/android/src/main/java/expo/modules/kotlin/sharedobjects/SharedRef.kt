package expo.modules.kotlin.sharedobjects

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

/**
 * Shared object (ref) that holds a strong reference to any native object. Allows passing references
 * to native instances among different independent libraries.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
open class SharedRef<RefType>(val ref: RefType) : SharedObject() {

  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData
}
