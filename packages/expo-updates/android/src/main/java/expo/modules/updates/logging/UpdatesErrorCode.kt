package expo.modules.updates.logging

typealias UpdatesErrorCode = expo.modules.updatesinterface.UpdatesErrorCode

/**
 * Chooses the code of a failed update or asset load.
 */
object LoadFailureCodes {
  /**
   * The code for a failed update or asset load: [UpdatesErrorCode.UpdateServerUnreachable] when the
   * device could not reach the server, and [otherwise] for any other failure.
   */
  fun forLoadFailure(error: Throwable, otherwise: UpdatesErrorCode): UpdatesErrorCode {
    return if (LoadFailures.isServerUnreachable(error)) {
      UpdatesErrorCode.UpdateServerUnreachable
    } else {
      otherwise
    }
  }
}
