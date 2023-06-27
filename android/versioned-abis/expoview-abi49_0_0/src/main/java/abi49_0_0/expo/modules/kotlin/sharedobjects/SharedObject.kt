package abi49_0_0.expo.modules.kotlin.sharedobjects

import abi49_0_0.expo.modules.core.interfaces.DoNotStrip

@DoNotStrip
open class SharedObject {
  /**
   * An identifier of the native shared object that maps to the JavaScript object.
   * When the object is not linked with any JavaScript object, its value is 0.
   */
  internal var sharedObjectId: SharedObjectId = SharedObjectId(0)
}
