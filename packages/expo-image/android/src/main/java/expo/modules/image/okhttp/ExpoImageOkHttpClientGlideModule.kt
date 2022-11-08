package expo.modules.image.okhttp

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.module.LibraryGlideModule
import okhttp3.OkHttpClient
import java.io.InputStream

@GlideModule
class ExpoImageOkHttpClientGlideModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    val client = OkHttpClient
      .Builder()
      .addNetworkInterceptor(OkHttpClientProgressInterceptor)
      .build()
    val factory = OkHttpUrlLoader.Factory(client)
    registry.replace(GlideUrl::class.java, InputStream::class.java, factory)
  }
}
