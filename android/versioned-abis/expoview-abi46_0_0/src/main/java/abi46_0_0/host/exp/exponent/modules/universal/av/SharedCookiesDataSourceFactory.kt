package abi46_0_0.host.exp.exponent.modules.universal.av

import abi46_0_0.com.facebook.react.bridge.ReactContext
import abi46_0_0.com.facebook.react.modules.network.NetworkingModule
import abi46_0_0.expo.modules.av.player.datasource.CustomHeadersOkHttpDataSourceFactory
import com.google.android.exoplayer2.upstream.DataSource
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory
import com.google.android.exoplayer2.upstream.TransferListener

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
