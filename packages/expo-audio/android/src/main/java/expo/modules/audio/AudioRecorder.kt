package expo.modules.audio

import android.content.Context
import androidx.media3.common.MediaItem
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject

class AudioRecorder(
  context: Context,
  appContext: AppContext,
  private val mediaItem: MediaItem
) : AutoCloseable, SharedObject(appContext) {
  override fun close() {
    TODO("Not yet implemented")
  }

  override fun deallocate() {
    close()
    super.deallocate()
  }

}
