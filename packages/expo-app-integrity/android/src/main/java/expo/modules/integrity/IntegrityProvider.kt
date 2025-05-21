package expo.modules.integrity

import com.google.android.play.core.integrity.StandardIntegrityManager
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityToken
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenProvider

object IntegrityProvider {
  var tokenProvider: StandardIntegrityManager.StandardIntegrityTokenProvider? = null
  var tokenException: Exception? = null

}