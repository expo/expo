package expo.modules.securestore.callbacks

import expo.modules.kotlin.Promise
import org.json.JSONException
import java.security.GeneralSecurityException

// Interface used to pass logic that needs to happen after encryption/decryption
fun interface PostEncryptionCallback {
  @Throws(JSONException::class, GeneralSecurityException::class)
  fun run(promise: Promise, result: Any)
}
