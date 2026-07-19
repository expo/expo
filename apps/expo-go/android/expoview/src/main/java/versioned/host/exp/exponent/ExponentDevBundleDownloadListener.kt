package versioned.host.exp.exponent

import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import host.exp.exponent.experience.DevBundleDownloadProgressListener
import host.exp.exponent.utils.HermesBundleUtils
import java.io.File
import kotlin.Exception

/**
 * Acts as a bridge between the versioned DevBundleDownloadListener and unversioned
 * DevBundleDownloadProgressListener. Optionally sniffs the downloaded bundle for the
 * Hermes magic header and fails instead of succeeding when matched.
 */
class ExponentDevBundleDownloadListener(
  private val listener: DevBundleDownloadProgressListener,
  private val downloadedBundleFileProvider: (() -> File?)? = null,
  private val onHermesDetected: ((Exception) -> Unit)? = null
) : DevBundleDownloadListener {
  override fun onSuccess() {
    val bundleFile = downloadedBundleFileProvider?.invoke()
    if (bundleFile != null && HermesBundleUtils.isHermesBundle(bundleFile)) {
      val error = Exception("hermes bytecode bundle is not supported by expo-go")
      onHermesDetected?.invoke(error)
      listener.onFailure(error)
      return
    }
    listener.onSuccess()
  }

  override fun onProgress(status: String?, done: Int?, total: Int?, percent: Int?) {
    listener.onProgress(status, done, total, percent)
  }

  override fun onFailure(cause: Exception) {
    listener.onFailure(cause)
  }
}
