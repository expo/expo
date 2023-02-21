package expo.modules.devlauncher.network

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response

@Suppress("unused")
class DevLauncherOkHttpInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    Log.e("ooxx", "url=${request.url()}")
    return chain.proceed(request)
  }
}