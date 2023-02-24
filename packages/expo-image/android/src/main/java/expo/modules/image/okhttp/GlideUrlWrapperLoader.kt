package expo.modules.image.okhttp

import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory
import com.facebook.react.modules.network.ProgressResponseBody
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import java.io.InputStream

class GlideUrlWrapperLoader(
  private val commonClient: OkHttpClient
) : ModelLoader<GlideUrlWrapper, InputStream> {
  override fun buildLoadData(
    model: GlideUrlWrapper,
    width: Int,
    height: Int,
    options: Options
  ): ModelLoader.LoadData<InputStream>? {
    val loader = OkHttpUrlLoader(
      commonClient
        .newBuilder()
        .addInterceptor(
          Interceptor { chain ->
            val originalResponse = chain.proceed(chain.request())
            originalResponse
              .newBuilder()
              .body(
                ProgressResponseBody(originalResponse.body) { bytesWritten, contentLength, done ->
                  model.progressListener?.onProgress(bytesWritten, contentLength, done)
                }
              )
              .build()
          }
        )
        .build()
    )

    return loader.buildLoadData(model.glideUrl, width, height, options)
  }

  // The default http loader always returns true.
  override fun handles(model: GlideUrlWrapper): Boolean = true

  class Factory(
    private val commonClient: OkHttpClient
  ) : ModelLoaderFactory<GlideUrlWrapper, InputStream> {
    override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<GlideUrlWrapper, InputStream> =
      GlideUrlWrapperLoader(commonClient)

    override fun teardown() = Unit
  }
}
