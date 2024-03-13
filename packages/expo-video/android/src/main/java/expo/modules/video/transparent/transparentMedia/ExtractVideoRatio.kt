package expo.modules.video.transparent.transparentMedia

import android.content.Context
import android.media.MediaMetadataRetriever
import android.util.Log
import androidx.media3.common.MediaItem

fun extractVideoRatio(context: Context, mediaItem: MediaItem?): Float? {
    val retriever = MediaMetadataRetriever()
    retriever.setDataSource(
        mediaItem?.localConfiguration?.uri?.path ?: return null
    )
    val videoWidth = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
        ?.toInt()
    val videoHeight = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
        ?.toInt()?.let { it / 2 }
    return if (videoWidth != null && videoHeight != null && videoWidth > 0 && videoHeight > 0) {
        videoWidth.toFloat() / videoHeight
    } else {
        Log.e(
            "extractVideoRatio",
            "Could not read video size (w : $videoWidth, h : $videoHeight)"
        )
        null
    }
}
