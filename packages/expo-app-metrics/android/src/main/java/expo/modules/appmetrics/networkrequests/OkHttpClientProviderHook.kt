// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import android.util.Log
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import expo.modules.appmetrics.TAG

/**
 * Installs `NetworkRequestInterceptor` into React Native's networking client so RN's `fetch` and
 * `XMLHttpRequest` flow through it automatically. App-owned `OkHttpClient` instances need a
 * one-line manual `addInterceptor(NetworkRequestInterceptor.instance)` to opt in.
 *
 * **Install timing.** `OkHttpClientProvider.getOkHttpClient()` lazily caches its client on first
 * use. The factory we set here is only consulted on that first creation; if RN's networking layer
 * (or another package) already triggered creation before this hook runs, we miss everything that
 * client touches. We can't fix that without bytecode rewriting - Datadog hit the same constraint
 * in production (DataDog/dd-sdk-android#513). We log a warning if we detect we landed too late
 * so engineers see it in logcat; the workaround is to install another hook earlier.
 */
object OkHttpClientProviderHook {
  @Volatile
  private var installed = false

  fun installIfNeeded() {
    if (installed) {
      return
    }
    installed = true

    if (isClientAlreadyCached()) {
      Log.w(
        TAG,
        "OkHttpClientProvider.client was already created before expo-app-metrics could install its" +
          " factory. Network requests that went through the existing client won't be observed." +
          " Either move expo-app-metrics earlier in your initialization or add" +
          " NetworkRequestInterceptor.instance to your custom OkHttp client manually."
      )
    }

    OkHttpClientProvider.setOkHttpClientFactory(object : OkHttpClientFactory {
      override fun createNewNetworkModuleClient() =
        OkHttpClientProvider.createClientBuilder()
          .addInterceptor(NetworkRequestInterceptor.instance)
          .eventListenerFactory(NetworkRequestEventListener.factory)
          .build()
    })
  }

  /**
   * `OkHttpClientProvider.client` is `internal`, so we reach it via reflection. Failures are
   * benign - if the field is no longer present or the access is denied, we assume the client
   * hasn't been cached and skip the warning. Worst case the warning is silent in a future RN
   * version; the factory installation itself is unaffected.
   */
  private fun isClientAlreadyCached(): Boolean = try {
    val providerClass = OkHttpClientProvider::class.java
    val field = providerClass.getDeclaredField("client").apply { isAccessible = true }
    field.get(OkHttpClientProvider) != null
  } catch (_: Throwable) {
    false
  }
}
