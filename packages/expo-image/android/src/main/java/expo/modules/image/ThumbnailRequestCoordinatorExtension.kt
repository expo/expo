package expo.modules.image

import android.util.Log
import com.bumptech.glide.request.Request
import com.bumptech.glide.request.ThumbnailRequestCoordinator

fun ThumbnailRequestCoordinator.getPrivateFullRequest(): Request? {
  return getPrivateField("full")
}

private fun <T> ThumbnailRequestCoordinator.getPrivateField(name: String): T? {
  return try {
    val field = this.javaClass.getDeclaredField(name)
    field.isAccessible = true
    @Suppress("UNCHECKED_CAST")
    field.get(this) as T
  } catch (e: Throwable) {
    Log.e("ExpoImage", "Couldn't receive the `$name` field", e)
    null
  }
}
