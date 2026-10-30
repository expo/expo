package expo.modules.updates.logging

import org.junit.Assert
import org.junit.Test
import java.io.EOFException
import java.io.IOException
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class UpdatesErrorCodeTest {
  @Test
  fun `a network failure is UpdateServerUnreachable`() {
    for (error in listOf(
      UnknownHostException("Unable to resolve host"),
      ConnectException("Failed to connect"),
      NoRouteToHostException("No route to host"),
      SocketException("Connection reset"),
      SocketTimeoutException("timeout")
    )) {
      Assert.assertEquals(
        UpdatesErrorCode.UpdateServerUnreachable,
        UpdatesErrorCode.forLoadFailure(error, otherwise = UpdatesErrorCode.UpdateFailedToLoad)
      )
    }
  }

  @Test
  fun `a network failure in the cause chain is UpdateServerUnreachable`() {
    val error = IOException("Failed to download asset", IOException("Request failed", ConnectException("Failed to connect")))
    Assert.assertEquals(
      UpdatesErrorCode.UpdateServerUnreachable,
      UpdatesErrorCode.forLoadFailure(error, otherwise = UpdatesErrorCode.AssetsFailedToLoad)
    )
  }

  @Test
  fun `any other failure keeps the given code`() {
    for (error in listOf(
      IOException("HTTP 500: server exploded"),
      IOException("Asset hash mismatch", IllegalStateException("bad hash")),
      EOFException("unexpected end of stream"),
      Exception("Unexpected error")
    )) {
      Assert.assertEquals(
        UpdatesErrorCode.AssetsFailedToLoad,
        UpdatesErrorCode.forLoadFailure(error, otherwise = UpdatesErrorCode.AssetsFailedToLoad)
      )
    }
  }
}
