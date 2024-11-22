package versioned.host.exp.exponent

import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import host.exp.exponent.experience.DevBundleDownloadProgressListener
import java.lang.Exception

/**
 * Acts as a bridge between the versioned DevBundleDownloadListener and unversioned
 * DevBundleDownloadProgressListener
 */
class ExponentDevBundleDownloadListener(private val listener: DevBundleDownloadProgressListener) :
  DevBundleDownloadListener {
  override fun onSuccess() {
    listener.onSuccess()
  }

  override fun onProgress(status: String?, done: Int?, total: Int?) {
    listener.onProgress(status, done, total)
  }

  override fun onFailure(cause: Exception?) {
    cause?.let {
      listener.onFailure(it)
    }
  }
}
