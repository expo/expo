package expo.modules.updates.loader

import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.OkHttpClient

internal fun createBaseClientBuilder(useReactNativeHttpClient: Boolean): OkHttpClient.Builder =
  if (useReactNativeHttpClient) {
    OkHttpClientProvider.getOkHttpClient().newBuilder()
  } else {
    OkHttpClient.Builder()
  }
