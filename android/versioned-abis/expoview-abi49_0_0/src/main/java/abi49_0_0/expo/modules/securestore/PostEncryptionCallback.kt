package abi49_0_0.expo.modules.securestore

import abi49_0_0.expo.modules.core.Promise
import org.json.JSONException
import java.security.GeneralSecurityException

// Interface used to pass logic that needs to happen after encryption/decryption
fun interface PostEncryptionCallback {
  @Throws(JSONException::class, GeneralSecurityException::class)
  fun run(promise: Promise, result: Any)
}
