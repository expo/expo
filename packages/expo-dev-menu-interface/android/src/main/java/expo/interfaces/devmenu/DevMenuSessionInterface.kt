package expo.interfaces.devmenu

import android.os.Bundle
import com.facebook.react.ReactInstanceManager

/**
 * Interface that represents a "session".
 * A session represents lifecycle/state of the dev menu while it is opened (between opening it and closing it).
 */
interface DevMenuSessionInterface {
  val reactInstanceManager: ReactInstanceManager
  val appInfo: Bundle
  val openScreen: String?
}
