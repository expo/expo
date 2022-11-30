package expo.modules.image.events

import com.facebook.react.modules.network.ProgressListener
import expo.modules.image.ExpoImageViewWrapper
import expo.modules.image.records.ImageProgressEvent
import java.lang.ref.WeakReference

class OkHttpProgressListener(
  private val expoImageViewWrapper: WeakReference<ExpoImageViewWrapper>
) : ProgressListener {
  override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) {
    if (contentLength <= 0) {
      return
    }

    expoImageViewWrapper.get()?.onProgress?.invoke(
      ImageProgressEvent(
        loaded = bytesWritten.toInt(),
        total = contentLength.toInt()
      )
    )
  }
}
