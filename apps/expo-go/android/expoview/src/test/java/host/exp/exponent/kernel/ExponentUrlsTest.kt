package host.exp.exponent.kernel

import org.junit.Assert.assertEquals
import org.junit.Test

class ExponentUrlsTest {
  @Test
  fun toExpRewritesTheSchemeAndDropsTheDefaultPort() {
    assertEquals("exp://10.0.0.5:8081", ExponentUrls.toExp("http://10.0.0.5:8081"))
    assertEquals("exp://10.0.0.5", ExponentUrls.toExp("http://10.0.0.5:80"))
    assertEquals("exps://u.expo.dev/abc?channel-name=main", ExponentUrls.toExp("https://u.expo.dev:443/abc?channel-name=main"))
    assertEquals("exps://u.expo.dev:8443/abc", ExponentUrls.toExp("https://u.expo.dev:8443/abc"))
  }

  @Test
  fun toExpKeepsExpUrlsAndTheirQuery() {
    assertEquals("exp://10.0.0.5:8081/--/p?__expo_disable_fab=1&x=a%2Bb", ExponentUrls.toExp("exp://10.0.0.5:8081/--/p?__expo_disable_fab=1&x=a%2Bb"))
    assertEquals("exps://u.expo.dev/abc", ExponentUrls.toExp("exps://u.expo.dev/abc"))
  }

  @Test
  fun toExpLeavesOpaqueUrlsAlone() {
    assertEquals("mailto:a@b.c", ExponentUrls.toExp("mailto:a@b.c"))
    assertEquals("not a url", ExponentUrls.toExp("not a url"))
  }
}
