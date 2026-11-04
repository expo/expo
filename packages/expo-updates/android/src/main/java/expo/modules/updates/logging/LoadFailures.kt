package expo.modules.updates.logging

import expo.modules.updatesinterface.UpdatesLogMessage
import java.io.IOException
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Asset failures of one update load that have the same key and HTTP status. [error] is the first
 * failure of the group.
 */
data class AssetFailureGroup(
  val assetKeys: List<String?>,
  val httpStatus: Int?,
  val error: Exception
)

/**
 * Thrown for a failure that was already logged where it happened. Load failure logging skips an
 * error with one of these in its cause chain, so the failure is not logged twice.
 */
class LoggedException(message: String, cause: Throwable) : IOException(message, cause)

object LoadFailures {
  /**
   * The key for a failed update or asset load: [unreachable] when the device could not reach the
   * server, and [failed] for any other failure.
   */
  fun message(error: Throwable, failed: UpdatesLogMessage, unreachable: UpdatesLogMessage): UpdatesLogMessage {
    return if (isServerUnreachable(error)) {
      unreachable
    } else {
      failed
    }
  }

  fun isServerUnreachable(error: Throwable): Boolean {
    // The iOS codes dataNotAllowed and internationalRoamingOff have no Android exception.
    return generateSequence(error) { it.cause }.any {
      it is UnknownHostException ||
        it is ConnectException ||
        it is NoRouteToHostException ||
        it is SocketTimeoutException ||
        isConnectionReset(it)
    }
  }

  // A plain SocketException is also thrown for a socket closed by a cancelled call, which is not
  // a network failure.
  private fun isConnectionReset(error: Throwable): Boolean {
    return error is SocketException &&
      error.message?.contains("reset", ignoreCase = true) == true
  }
}
