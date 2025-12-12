package expo.modules.updatesinterface

import java.lang.ref.WeakReference

object UpdatesControllerRegistry {
  var controller: WeakReference<UpdatesInterface>? = null
}
