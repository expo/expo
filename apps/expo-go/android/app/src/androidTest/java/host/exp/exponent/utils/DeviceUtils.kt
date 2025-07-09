package host.exp.exponent.utils

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.Switch
import androidx.test.InstrumentationRegistry
import androidx.test.uiautomator.*

private const val LAUNCH_TIMEOUT = 5000

object DeviceUtils {
  fun allowDrawingOverOtherApps(uiDevice: UiDevice) {
    // Start from the home screen
    uiDevice.pressHome()

    // Wait for launcher
    val launcherPackage = uiDevice.launcherPackageName
    uiDevice.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), LAUNCH_TIMEOUT.toLong())

    val context = InstrumentationRegistry.getContext()
    // Enable draw over other apps if necessary
    if (!Settings.canDrawOverlays(context)) {
      // Open settings
      val intent =
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:host.exp.exponent"))
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)
      context.startActivity(intent)

      // Wait for the app to appear
      uiDevice.wait(
        Until.hasObject(By.textContains("Permit drawing over other apps")),
        LAUNCH_TIMEOUT.toLong()
      )
      val switchObject = uiDevice.findObject(UiSelector().className(Switch::class.java.name))
      try {
        if (!switchObject.isChecked) {
          switchObject.click()
        }
      } catch (e: UiObjectNotFoundException) {
        e.printStackTrace()
      }
    }
  }
}
