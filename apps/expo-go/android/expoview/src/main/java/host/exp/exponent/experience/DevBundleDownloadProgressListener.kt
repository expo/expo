// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

interface DevBundleDownloadProgressListener {
  fun onProgress(status: String?, done: Int?, total: Int?)
  fun onSuccess()
  fun onFailure(error: Exception)
}
