package expo.modules.sharing

import android.content.Intent
import expo.modules.core.interfaces.SingletonModule

object SharingSingleton : SingletonModule {

  override fun getName(): String {
    return "ShareInto"
  }

  var intent: Intent? = null
}
