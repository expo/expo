package expo.modules.image

import com.bumptech.glide.request.Request
import com.bumptech.glide.request.ThumbnailRequestCoordinator

fun ThumbnailRequestCoordinator.getPrivateFullRequest(): Request? {
  return getPrivateRequest("full")
}

private fun ThumbnailRequestCoordinator.getPrivateRequest(name: String): Request? {
  return try {
    val filed = this.javaClass.getDeclaredField(name)
    filed.isAccessible = true
    filed.get(this) as Request
  } catch (e: Throwable) {
    null
  }
}
