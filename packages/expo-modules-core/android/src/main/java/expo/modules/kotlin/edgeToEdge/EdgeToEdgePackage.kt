package expo.modules.kotlin.edgeToEdge

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Log
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class EdgeToEdgePackage : BasePackage() {
  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener?> {
    return listOf(object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
        activity?.let { updateEdgeToEdgeFeatureFlag(it) }
      }
    })
  }
}

private fun updateEdgeToEdgeFeatureFlag(activity: Activity) {
  val methodName = "updateEdgeToEdgeFeatureFlag"
  val className = "com.facebook.react.views.view.WindowUtilKt"

  runCatching {
    val method = Class.forName(className).getDeclaredMethod(methodName, Activity::class.java)
    method.isAccessible = true
    method.invoke(null, activity)
  }.onFailure {
    Log.e("EdgeToEdgePackage", "Failed to invoke '$methodName' on $className", it)
  }
}
