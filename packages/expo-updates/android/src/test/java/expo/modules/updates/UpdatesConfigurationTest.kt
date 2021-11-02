package expo.modules.updates

import android.net.Uri
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.runners.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class UpdatesConfigurationTest {
  @Test
  fun testGetNormalizedUrlOrigin_NoPort() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns -1
    Assert.assertEquals("https://exp.host", UpdatesConfiguration.getNormalizedUrlOrigin(mockedUri))
  }

  @Test
  fun testGetNormalizedUrlOrigin_DefaultPort() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns 443
    Assert.assertEquals("https://exp.host", UpdatesConfiguration.getNormalizedUrlOrigin(mockedUri))
  }

  @Test
  fun testGetNormalizedUrlOrigin_OtherPort() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns 47
    Assert.assertEquals(
      "https://exp.host:47",
      UpdatesConfiguration.getNormalizedUrlOrigin(mockedUri)
    )
  }
}
