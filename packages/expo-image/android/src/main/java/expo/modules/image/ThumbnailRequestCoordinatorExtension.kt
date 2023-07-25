package expo.modules.image

import android.util.Log
import com.bumptech.glide.request.Request
import com.bumptech.glide.request.ThumbnailRequestCoordinator

fun ThumbnailRequestCoordinator.getPrivateFullRequest(): Request? {
  return getPrivateFiled("full")
}

private fun <T> ThumbnailRequestCoordinator.getPrivateFiled(name: String): T? {
  return try {
    val filed = this.javaClass.getDeclaredField(name)
    filed.isAccessible = true
    @Suppress("UNCHECKED_CAST")
    filed.get(this) as T
  } catch (e: Throwable) {
    Log.e("ExpoImage", "Couldn't receive the `$name` field", e)
    null
  }
}
