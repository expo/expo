package expo.modules.video

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy
import java.net.ConnectException
import java.net.UnknownHostException

/**
 * Treats "the request never reached a server" (`UnknownHostException`, `ConnectException`) as a
 * reason to try another track, the way [DefaultLoadErrorHandlingPolicy] already does for HTTP
 * 403/404/410/416/500/503.
 *
 * With `useCaching`, only the renditions ABR happened to fetch while online are in the cache. When
 * the device is offline and ABR opens on a rendition that is not cached, the default policy has no
 * fallback for a transport error, so playback fails even though another rendition of the same
 * content is fully cached. Excluding the unreachable rendition for a short time lets track selection
 * move to one the cache can serve.
 */
@OptIn(UnstableApi::class)
internal class TransportFallbackLoadErrorHandlingPolicy : DefaultLoadErrorHandlingPolicy() {
  override fun getFallbackSelectionFor(
    fallbackOptions: LoadErrorHandlingPolicy.FallbackOptions,
    loadErrorInfo: LoadErrorHandlingPolicy.LoadErrorInfo
  ): LoadErrorHandlingPolicy.FallbackSelection? {
    if (isTransportFailure(loadErrorInfo.exception) &&
      fallbackOptions.isFallbackAvailable(LoadErrorHandlingPolicy.FALLBACK_TYPE_TRACK)
    ) {
      return LoadErrorHandlingPolicy.FallbackSelection(
        LoadErrorHandlingPolicy.FALLBACK_TYPE_TRACK,
        TRANSPORT_EXCLUSION_MS
      )
    }
    return super.getFallbackSelectionFor(fallbackOptions, loadErrorInfo)
  }

  private fun isTransportFailure(error: Throwable?): Boolean {
    var cause = error
    var depth = 0
    while (cause != null && depth < MAX_CAUSE_DEPTH) {
      if (cause is UnknownHostException || cause is ConnectException) {
        return true
      }
      cause = cause.cause
      depth++
    }
    return false
  }

  private companion object {
    const val TRANSPORT_EXCLUSION_MS = 30_000L
    const val MAX_CAUSE_DEPTH = 8
  }
}
