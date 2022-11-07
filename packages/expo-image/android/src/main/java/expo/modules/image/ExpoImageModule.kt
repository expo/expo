package expo.modules.image

import android.util.Log
import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class ExpoImageModule : Module() {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)

  override fun definition() = ModuleDefinition {
    Name("ExpoImageModule")

    AsyncFunction("prefetch") { url: String, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      moduleCoroutineScope.launch {
        try {
          val glideUrl = GlideUrl(url)
          val result = Glide.with(context)
            .download(glideUrl)
            .submit()
            .awaitGet()
          if (result != null) {
            promise.resolve(null)
          } else {
            promise.reject(ImagePrefetchFailure("cannot download $url"))
          }
        } catch (e: Exception) {
          promise.reject(ImagePrefetchFailure(e.message ?: e.toString()))
        }
      }
    }

    OnDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.w("ExpoImageModule", "No coroutines to cancel")
      }
    }
  }
}
