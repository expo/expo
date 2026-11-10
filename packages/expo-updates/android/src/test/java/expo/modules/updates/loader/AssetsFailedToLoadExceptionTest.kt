package expo.modules.updates.loader

import org.junit.Assert
import org.junit.Test
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class AssetsFailedToLoadExceptionTest {
  @Test
  fun `asset failures group by reachability and HTTP status`() {
    val failures = listOf(
      AssetLoadFailure("a", IOException("Failed to download asset", FileDownloader.AssetHttpResponseException(404, "not found"))),
      AssetLoadFailure("b", IOException("Failed to download asset", SocketTimeoutException("timeout"))),
      AssetLoadFailure("c", IOException("Failed to download asset", FileDownloader.AssetHttpResponseException(404, "not found"))),
      AssetLoadFailure("d", IOException("Failed to download asset", FileDownloader.AssetHttpResponseException(500, "server exploded"))),
      AssetLoadFailure("e", IOException("Failed to download asset", UnknownHostException("Unable to resolve host")))
    )

    val groups = AssetsFailedToLoadException.failureGroups(IOException("Failed to load update", AssetsFailedToLoadException(failures)))

    Assert.assertEquals(listOf(listOf("a", "c"), listOf("b", "e"), listOf("d")), groups?.map { it.assetKeys })
    Assert.assertEquals(listOf(404, null, 500), groups?.map { it.httpStatus })
    Assert.assertEquals(listOf("a", "b", "d").map { key -> failures.first { it.assetKey == key }.error }, groups?.map { it.error })
  }

  @Test
  fun `an error without asset failures has no groups`() {
    Assert.assertNull(AssetsFailedToLoadException.failureGroups(IOException("HTTP 500: server exploded")))
  }
}
