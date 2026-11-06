package expo.modules.updates.logging

import expo.modules.updates.loader.AssetLoadFailure
import expo.modules.updates.loader.FileDownloader
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

typealias UpdatesErrorCode = expo.modules.updatesinterface.UpdatesErrorCode

/**
 * Chooses the code of a failed update or asset load.
 */
object LoadFailureCodes {
  /**
   * The code for a failed update or asset load: [UpdatesErrorCode.UpdateServerUnreachable] when the device could
   * not reach the server, and [otherwise] for any other failure.
   */
  fun forLoadFailure(error: Throwable, otherwise: UpdatesErrorCode): UpdatesErrorCode {
    // The iOS codes dataNotAllowed and internationalRoamingOff have no Android exception.
    val serverUnreachable = generateSequence(error) { it.cause }.any {
      it is UnknownHostException ||
        it is ConnectException ||
        it is NoRouteToHostException ||
        it is SocketTimeoutException ||
        isConnectionReset(it)
    }
    return if (serverUnreachable) {
      UpdatesErrorCode.UpdateServerUnreachable
    } else {
      otherwise
    }
  }

  // A plain SocketException is also thrown for a socket closed by a cancelled call, which is not
  // a network failure.
  private fun isConnectionReset(error: Throwable): Boolean {
    return error is SocketException &&
      error.message?.contains("reset", ignoreCase = true) == true
  }

  /**
   * Groups asset failures by their code and HTTP status, in the order each group first fails.
   */
  fun groups(failures: List<AssetLoadFailure>): List<Pair<UpdatesErrorCode, List<AssetLoadFailure>>> {
    return failures
      .groupBy { failure -> Pair(forLoadFailure(failure.error, UpdatesErrorCode.AssetsFailedToLoad), httpStatus(failure.error)) }
      .map { (key, groupFailures) -> Pair(key.first, groupFailures) }
  }

  private fun httpStatus(error: Throwable): Int? =
    generateSequence(error) { it.cause }
      .filterIsInstance<FileDownloader.AssetHttpResponseException>()
      .firstOrNull()
      ?.statusCode
}
