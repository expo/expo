package expo.modules.image.events

import com.facebook.react.modules.network.ProgressListener
import expo.modules.image.ExpoImageViewWrapper
import expo.modules.image.records.ImageProgressEvent
import java.lang.ref.WeakReference

class OkHttpProgressListener(
  private val expoImageViewWrapper: WeakReference<ExpoImageViewWrapper>
) : ProgressListener {
  override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) {
    // OkHttp calls that function twice at the end - when the last byte was downloaded with done set to false,
    // and also shortly after, with done set to true. In both cases, the bytesWritten and the contentLength are equal.
    // We want to avoid sending two same events to JS, that's why we return when done is set to true.
    if (contentLength <= 0 || done) {
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
