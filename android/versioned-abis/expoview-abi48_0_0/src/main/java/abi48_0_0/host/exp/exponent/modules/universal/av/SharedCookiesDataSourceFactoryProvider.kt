package abi48_0_0.host.exp.exponent.modules.universal.av

import android.content.Context
import abi48_0_0.com.facebook.react.bridge.ReactContext
import com.google.android.exoplayer2.upstream.DataSource
import com.google.android.exoplayer2.upstream.TransferListener
import abi48_0_0.expo.modules.av.player.datasource.SharedCookiesDataSourceFactoryProvider
import abi48_0_0.expo.modules.core.ModuleRegistry
import host.exp.exponent.utils.ScopedContext

class SharedCookiesDataSourceFactoryProvider : SharedCookiesDataSourceFactoryProvider() {
  override fun createFactory(
    context: Context,
    moduleRegistry: ModuleRegistry,
    userAgent: String,
    requestHeaders: Map<String, Any>?,
    transferListener: TransferListener
  ): DataSource.Factory {
    val reactContext: ReactContext = when (context) {
      is ReactContext -> context
      is ScopedContext -> context.context as ReactContext
      else -> throw Exception("Invalid context supplied to SharedCookiesDataSourceFactoryProvider")
    }
    return SharedCookiesDataSourceFactory(reactContext, userAgent, requestHeaders, transferListener)
  }
}
