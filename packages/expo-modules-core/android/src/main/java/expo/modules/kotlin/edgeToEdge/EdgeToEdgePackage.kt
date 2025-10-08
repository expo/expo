package expo.modules.kotlin.edgeToEdge

import android.R
import android.app.Activity
import android.content.Context
import android.content.res.TypedArray
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.Window
import androidx.annotation.RequiresApi
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import kotlin.Unit

class EdgeToEdgePackage : BasePackage() {
  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener?>? {
    return listOf(object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
        val edgeToEdgeEnabled = invokeWindowUtilKtMethod<Boolean>("isEdgeToEdgeFeatureFlagOn") ?: true

        if (edgeToEdgeEnabled) {
          invokeWindowUtilKtMethod<Unit>("enableEdgeToEdge", Pair(Window::class.java, activity?.window))

          // React-native sets `window.isNavigationBarContrastEnforced` to `true` in `WindowUtilKt.enableEdgeToEdge`.
          // We have to set it back to the value defined in the app styles, which comes from our config plugin.
          activity?.enforceNavigationBarContrastFromTheme()
        }
      }
    })
  }
}

@RequiresApi(Build.VERSION_CODES.Q)
private fun Activity.getEnforceContrastFromTheme(): Boolean {
  val attrs = intArrayOf(R.attr.enforceNavigationBarContrast)
  val typedArray: TypedArray = theme.obtainStyledAttributes(attrs)

  return try {
    typedArray.getBoolean(0, true)
  } finally {
    typedArray.recycle()
  }
}

private fun Activity.enforceNavigationBarContrastFromTheme() {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    window.isNavigationBarContrastEnforced = getEnforceContrastFromTheme()
  }
}

private inline fun <reified T> invokeWindowUtilKtMethod(
  methodName: String,
  vararg args: Pair<Class<*>, Any?>
): T? {
  val windowUtilClassName = "com.facebook.react.views.view.WindowUtilKt"

  return runCatching {
    val windowUtilKtClass = Class.forName(windowUtilClassName)
    val parameterTypes = args.map { it.first }.toTypedArray()
    val parameterValues = args.map { it.second }.toTypedArray()
    val method = windowUtilKtClass.getDeclaredMethod(methodName, *parameterTypes)

    method.isAccessible = true
    method.invoke(null, *parameterValues) as? T
  }.onFailure {
    Log.e("EdgeToEdgePackage", "Failed to invoke '$methodName' on $windowUtilClassName", it)
  }.getOrNull()
}
