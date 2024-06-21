package expo.modules.video.records

import androidx.media3.common.PlaybackException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class PlaybackError(
  @Field var message: String? = null
) : Record, Serializable {
  constructor(exception: PlaybackException) : this(errorMessageFromException(exception))

  companion object {
    private fun errorMessageFromException(exception: PlaybackException): String {
      val reason = "${exception.localizedMessage} ${exception.cause?.localizedMessage ?: ""}"
      return "A playback exception has occurred: $reason"
    }
  }
}
