package expo.modules.appauth

import net.openid.appauth.AuthorizationException
import org.unimodules.core.Promise

class AuthTask {
  private var mPromise: Promise? = null
  private var mTag: String? = null
  fun update(promise: Promise, tag: String?): Boolean {
    return if (mPromise == null) {
      mPromise = promise
      mTag = tag
      true
    } else {
      promise.reject(AppAuthConstants.Error.CONCURRENT_TASK, "Cannot start a new task while another task is currently in progress: $mTag")
      false
    }
  }

  fun resolve(value: Any?) {
    val promise = mPromise ?: return
    promise.resolve(value)
    clear()
  }

  fun reject(e: Exception) {
    if (e is AuthorizationException) {
      val authorizationException = e
      this.reject(authorizationException.code.toString(), authorizationException.localizedMessage)
    } else {
      this.reject(AppAuthConstants.Error.DEFAULT, e.localizedMessage)
    }
  }

  fun reject(code: String?, message: String) {
    val promise = mPromise ?: return
    promise.reject(code, "ExpoAppAuth.$mTag: $message")
    clear()
  }

  private fun clear() {
    mPromise = null
    mTag = null
  }
}