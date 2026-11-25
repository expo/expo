package host.exp.exponent.network

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalNetworkPermissionTest {
  @Test
  fun privateIpv4RangesAreLocal() {
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("192.168.1.5"))
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("10.0.2.2"))
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("172.16.0.1"))
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("172.31.255.254"))
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("169.254.1.1"))
  }

  @Test
  fun publicAndLoopbackHostsAreNotLocal() {
    assertFalse(LocalNetworkPermission.isLocalNetworkHost("172.32.0.1"))
    assertFalse(LocalNetworkPermission.isLocalNetworkHost("8.8.8.8"))
    assertFalse(LocalNetworkPermission.isLocalNetworkHost("127.0.0.1"))
    assertFalse(LocalNetworkPermission.isLocalNetworkHost("localhost"))
    assertFalse(LocalNetworkPermission.isLocalNetworkHost("u.expo.dev"))
    assertFalse(LocalNetworkPermission.isLocalNetworkHost("abc-123.anonymous.exp.direct"))
  }

  @Test
  fun mdnsAndLinkLocalIpv6HostsAreLocal() {
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("my-mac.local"))
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("[fe80::1%wlan0]"))
    assertTrue(LocalNetworkPermission.isLocalNetworkHost("fe80::1"))
  }

  @Test
  fun urlsAreClassifiedByHost() {
    assertTrue(LocalNetworkPermission.isLocalNetworkUrl("exp://192.168.1.5:8081"))
    assertTrue(LocalNetworkPermission.isLocalNetworkUrl("http://192.168.1.5:8081/--/settings?x=1"))
    assertTrue(LocalNetworkPermission.isLocalNetworkUrl("exp://my-mac.local:8081"))
    assertFalse(LocalNetworkPermission.isLocalNetworkUrl("exp://127.0.0.1:8081"))
    assertFalse(LocalNetworkPermission.isLocalNetworkUrl("exp://u.expo.dev/933fd9c0?runtime-version=exposdk:58.0.0"))
    assertFalse(LocalNetworkPermission.isLocalNetworkUrl("https://expo.dev/@user/project"))
  }

  @Test
  fun malformedUrlsAreNotLocal() {
    assertFalse(LocalNetworkPermission.isLocalNetworkUrl("not a url"))
    assertFalse(LocalNetworkPermission.isLocalNetworkUrl(""))
    assertFalse(LocalNetworkPermission.isLocalNetworkUrl("exp://"))
  }
}
