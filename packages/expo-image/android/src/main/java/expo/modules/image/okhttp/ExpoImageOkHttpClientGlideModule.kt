package expo.modules.image.okhttp

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.module.LibraryGlideModule
import expo.modules.image.events.OkHttpProgressListener
import okhttp3.OkHttpClient
import java.io.InputStream

/**
 * To connect listener with the request we have to create custom model.
 * In that way, we're passing more information to the final data loader.
 */
data class GlideUrlWrapper(val glideUrl: GlideUrl) {
  var progressListener: OkHttpProgressListener? = null
}

@GlideModule
class ExpoImageOkHttpClientGlideModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    val client = OkHttpClient()
    // We don't use the `GlideUrl` directly but we want to replace the default okhttp loader anyway
    // to make sure that the app will use only one client.
    registry.replace(GlideUrl::class.java, InputStream::class.java, OkHttpUrlLoader.Factory(client))
    registry.prepend(GlideUrlWrapper::class.java, InputStream::class.java, GlideUrlWrapperLoader.Factory(client))
  }
}
