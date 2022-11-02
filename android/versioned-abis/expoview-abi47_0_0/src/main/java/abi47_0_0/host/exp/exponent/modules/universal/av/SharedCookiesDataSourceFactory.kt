package abi47_0_0.host.exp.exponent.modules.universal.av

import abi47_0_0.com.facebook.react.bridge.ReactContext
import abi47_0_0.com.facebook.react.modules.network.NetworkingModule
import com.google.android.exoplayer2.upstream.DataSource
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory
import com.google.android.exoplayer2.upstream.TransferListener
import abi47_0_0.expo.modules.av.player.datasource.CustomHeadersOkHttpDataSourceFactory

class SharedCookiesDataSourceFactory(
  reactApplicationContext: ReactContext,
  userAgent: String,
  requestHeaders: Map<String, Any>?,
  transferListener: TransferListener?
) : DataSource.Factory {
  private val dataSourceFactory: DataSource.Factory = DefaultDataSourceFactory(
    reactApplicationContext,
    transferListener,
    CustomHeadersOkHttpDataSourceFactory(
      (reactApplicationContext.catalystInstance.getNativeModule("Networking") as NetworkingModule?)!!.mClient,
      userAgent,
      requestHeaders
    )
  )

  override fun createDataSource(): DataSource {
    return dataSourceFactory.createDataSource()
  }
}
