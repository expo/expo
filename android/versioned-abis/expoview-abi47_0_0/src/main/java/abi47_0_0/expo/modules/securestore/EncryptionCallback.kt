package abi47_0_0.expo.modules.securestore

import abi47_0_0.expo.modules.core.Promise
import org.json.JSONException
import java.security.GeneralSecurityException
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec

// Interface used to pass encryption/decryption logic
fun interface EncryptionCallback {
  @Throws(GeneralSecurityException::class, JSONException::class)
  fun run(
    promise: Promise,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    postEncryptionCallback: PostEncryptionCallback?
  ): Any
}
