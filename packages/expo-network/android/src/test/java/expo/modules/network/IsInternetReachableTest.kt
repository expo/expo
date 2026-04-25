package expo.modules.network

import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkInfo
import android.os.Build
import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowNetworkInfo

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.TIRAMISU])
class IsInternetReachableTest {
  private lateinit var connectivityManager: ConnectivityManager
  private lateinit var network: Network
  private lateinit var capabilities: NetworkCapabilities

  @Before
  fun setUp() {
    connectivityManager = mockk()
    network = mockk()
    capabilities = mockk()
  }

  // --- Basic null guards ---

  @Test
  fun `returns false when no active network`() {
    every { connectivityManager.activeNetwork } returns null

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isFalse()
  }

  @Test
  fun `returns false when capabilities are null`() {
    every { connectivityManager.activeNetwork } returns network
    every { connectivityManager.getNetworkCapabilities(network) } returns null

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isFalse()
  }

  // --- API 29+ (Q) path ---

  @Test
  fun `returns true when INTERNET, VALIDATED, and NOT_SUSPENDED on API 29+`() {
    stubCapabilities(internet = true, validated = true, notSuspended = true, vpn = false)

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isTrue()
  }

  @Test
  fun `returns false when INTERNET capability is missing on API 29+`() {
    stubCapabilities(internet = false, validated = true, notSuspended = true, vpn = false)

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isFalse()
  }

  @Test
  fun `returns false when VALIDATED capability is missing on API 29+`() {
    stubCapabilities(internet = true, validated = false, notSuspended = true, vpn = false)

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isFalse()
  }

  @Test
  fun `returns false when network is suspended on API 29+`() {
    stubCapabilities(internet = true, validated = true, notSuspended = false, vpn = false)

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isFalse()
  }

  // --- VPN checks (API 29+) ---

  @Test
  fun `returns false for VPN connection with zero downstream bandwidth`() {
    stubCapabilities(internet = true, validated = true, notSuspended = true, vpn = true)
    every { capabilities.linkDownstreamBandwidthKbps } returns 0

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isFalse()
  }

  @Test
  fun `returns true for VPN connection with non-zero downstream bandwidth`() {
    stubCapabilities(internet = true, validated = true, notSuspended = true, vpn = true)
    every { capabilities.linkDownstreamBandwidthKbps } returns 1000

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.Q)).isTrue()
  }

  // --- Pre-API 29 (P) path ---

  @Test
  fun `returns true when connected on pre-API 29`() {
    val networkInfo = ShadowNetworkInfo.newInstance(
      NetworkInfo.DetailedState.CONNECTED,
      ConnectivityManager.TYPE_WIFI, 0, true, NetworkInfo.State.CONNECTED
    )
    every { connectivityManager.activeNetwork } returns network
    every { connectivityManager.getNetworkCapabilities(network) } returns capabilities
    every { connectivityManager.getNetworkInfo(network) } returns networkInfo
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) } returns true
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) } returns true
    every { capabilities.hasTransport(any()) } returns false

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.P)).isTrue()
  }

  @Test
  fun `returns false when suspended on pre-API 29`() {
    val networkInfo = ShadowNetworkInfo.newInstance(
      NetworkInfo.DetailedState.SUSPENDED,
      ConnectivityManager.TYPE_WIFI, 0, true, NetworkInfo.State.SUSPENDED
    )
    every { connectivityManager.activeNetwork } returns network
    every { connectivityManager.getNetworkCapabilities(network) } returns capabilities
    every { connectivityManager.getNetworkInfo(network) } returns networkInfo
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) } returns true
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) } returns true
    every { capabilities.hasTransport(any()) } returns false

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.P)).isFalse()
  }

  @Test
  fun `returns false when networkInfo is null on pre-API 29`() {
    every { connectivityManager.activeNetwork } returns network
    every { connectivityManager.getNetworkCapabilities(network) } returns capabilities
    every { connectivityManager.getNetworkInfo(network) } returns null
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) } returns true
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) } returns true
    every { capabilities.hasTransport(any()) } returns false

    assertThat(isInternetReachable(connectivityManager, Build.VERSION_CODES.P)).isFalse()
  }

  // --- Helpers ---

  private fun stubCapabilities(
    internet: Boolean,
    validated: Boolean,
    notSuspended: Boolean,
    vpn: Boolean
  ) {
    every { connectivityManager.activeNetwork } returns network
    every { connectivityManager.getNetworkCapabilities(network) } returns capabilities
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) } returns internet
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) } returns validated
    every { capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_SUSPENDED) } returns notSuspended
    every { capabilities.hasTransport(any()) } returns false
    every { capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN) } returns vpn
  }
}
