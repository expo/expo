package expo.modules.devmenu.api

import android.app.Activity
import expo.modules.devmenu.DevMenuFragment
import kotlin.reflect.KProperty

class FragmentDelegate<T>(
  private val activityProvider: () -> Activity?,
  private val mapper: (DevMenuFragment) -> T
) {
  val value: T?
    get() {
      val fragment = DevMenuFragment.findIn(activityProvider()) ?: return null
      return mapper(fragment)
    }

  operator fun getValue(thisRef: Any?, property: KProperty<*>): T? = value
}
