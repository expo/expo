package devmenu.com.th3rdwave.safeareacontext

import android.view.View
import android.view.ViewGroup
import com.facebook.react.common.MapBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SafeAreaProviderManager : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNCSafeAreaProvider")
    Constants {
      mapOf("initialWindowMetrics" to initialWindowMetrics)
    }
    View(SafeAreaProvider::class) {
      Events("onInsetsChange")
    }
  }

  private val initialWindowMetrics: Map<String, Any>?
    get() {
      val activity = appContext.currentActivity ?: return null
      val decorView = activity.window.decorView as ViewGroup
      val contentView = decorView.findViewById<View>(android.R.id.content) ?: return null
      val insets = SafeAreaUtils.getSafeAreaInsets(decorView)
      val frame = SafeAreaUtils.getFrame(decorView, contentView)
      return if (insets == null || frame == null) {
        null
      } else MapBuilder.of<String, Any>(
        "insets",
        SerializationUtils.edgeInsetsToJavaMap(insets),
        "frame",
        SerializationUtils.rectToJavaMap(frame))
    }
}
