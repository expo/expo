package expo.modules.devmenu.managers

import android.app.Activity
import android.content.Intent
import expo.modules.devmenu.DevMenuActivity
import expo.modules.devmenu.DevMenuActivityLifecycleHandler
import java.lang.ref.WeakReference

open class DevMenuActivityManager : DevMenuActivityLifecycleHandler {
  private var currentDevMenuActivity: WeakReference<DevMenuActivity?> = WeakReference(null)

  fun openMenu(activity: Activity) {
    switchBundler()
    activity.startActivity(Intent(activity, DevMenuActivity::class.java))
  }

  fun hideMenu() {
    currentDevMenuActivity.get()?.finish()
  }

  override fun devMenuHasBeenOpened(devMenuActivity: DevMenuActivity) {
    currentDevMenuActivity = WeakReference(devMenuActivity)
  }

  override fun devMenuHasBeenDestroyed() {
    currentDevMenuActivity = WeakReference(null)
    switchBundler()
  }

  open fun switchBundler() = Unit
}
