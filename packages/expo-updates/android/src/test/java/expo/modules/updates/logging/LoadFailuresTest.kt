package expo.modules.updates.logging

import expo.modules.updatesinterface.UpdatesLogMessage
import org.junit.Assert
import org.junit.Test
import java.io.EOFException
import java.io.IOException
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class LoadFailuresTest {
  @Test
  fun `a network failure takes the unreachable key`() {
    for (error in listOf(
      UnknownHostException("Unable to resolve host"),
      ConnectException("Failed to connect"),
      NoRouteToHostException("No route to host"),
      SocketException("Connection reset"),
      SocketException("recvfrom failed: ECONNRESET (Connection reset by peer)"),
      SocketTimeoutException("timeout")
    )) {
      Assert.assertEquals(UpdatesLogMessage.RemoteFetchUnreachable, forFetch(error))
    }
  }

  @Test
  fun `a network failure in the cause chain takes the unreachable key`() {
    val error = IOException("Failed to download asset", IOException("Request failed", ConnectException("Failed to connect")))
    Assert.assertEquals(UpdatesLogMessage.RemoteFetchUnreachable, forFetch(error))
  }

  @Test
  fun `any other failure takes the failed key`() {
    for (error in listOf(
      IOException("HTTP 500: server exploded"),
      IOException("Asset hash mismatch", IllegalStateException("bad hash")),
      EOFException("unexpected end of stream"),
      SocketException("Socket closed"),
      SocketException("Socket is closed"),
      IOException("Canceled", SocketException("Socket closed")),
      Exception("Unexpected error")
    )) {
      Assert.assertEquals(UpdatesLogMessage.RemoteFetchFailed, forFetch(error))
    }
  }

  private fun forFetch(error: Throwable) =
    LoadFailures.message(error, UpdatesLogMessage.RemoteFetchFailed, UpdatesLogMessage.RemoteFetchUnreachable)
}
