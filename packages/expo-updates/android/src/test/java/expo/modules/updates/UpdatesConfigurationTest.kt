package expo.modules.updates

import android.net.Uri
import io.mockk.every
import io.mockk.mockk
import junit.framework.TestCase
import org.junit.Assert

class UpdatesConfigurationTest : TestCase() {
  fun testGetNormalizedUrlOrigin_NoPort() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns -1
    Assert.assertEquals("https://exp.host", getNormalizedUrlOrigin(mockedUri))
  }

  fun testGetNormalizedUrlOrigin_DefaultPort() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns 443
    Assert.assertEquals("https://exp.host", getNormalizedUrlOrigin(mockedUri))
  }

  fun testGetNormalizedUrlOrigin_OtherPort() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns 47
    Assert.assertEquals(
      "https://exp.host:47",
      getNormalizedUrlOrigin(mockedUri)
    )
  }
}
